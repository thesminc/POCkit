/**
 * Conversation Agent
 *
 * Manages conversational Q&A flow for POC generation.
 * Handles one question at a time, generates follow-ups, and evaluates completeness.
 */

import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import { CONVERSATION_SYSTEM_PROMPT, INITIAL_QUESTIONS_PROMPT } from './prompts/conversation';
import { getSessionData, logAgentExecution } from './tools/database-tools';
import { getAllFileContents } from './tools/file-tools';
import { buildContextPrompt } from './tools/context-tools';
import { createLogger } from '../config/logger';

const logger = createLogger();
const prisma = new PrismaClient();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

// Question limits
const MAX_INITIAL_QUESTIONS = 8;
const MAX_TOTAL_QUESTIONS = 12;
const MAX_FOLLOW_UPS_PER_ANSWER = 1;

export interface ConversationResult {
  nextQuestion: string | null;
  isFollowUp: boolean;
  isComplete: boolean;
  progress: {
    asked: number;
    total: number;
  };
  extractedInfo?: {
    keyFacts: string[];
    preferences: string[];
  };
}

export interface InitializeResult {
  started: boolean;
  firstQuestion: string;
  totalQuestions: number;
}

interface QuestionQueueItem {
  id: string;
  sessionId: string;
  question: string;
  category: string | null;
  priority: number;
  status: string;
  answer: string | null;
  askedAt: Date | null;
  answeredAt: Date | null;
  parentId: string | null;
  createdAt: Date;
}

interface ConversationEvaluation {
  extractedInfo: {
    keyFacts: string[];
    preferences: string[];
    newGaps: string[];
  };
  answerQuality: 'complete' | 'partial' | 'off_topic';
  action: 'ASK_FOLLOW_UP' | 'NEXT_QUESTION' | 'GENERATE_NEW' | 'COMPLETE';
  followUpQuestion?: string;
  newQuestions?: string[];
  skipQuestionIndices?: number[];
  reasoning: string;
}

export class ConversationAgent {
  private model: string;

  constructor(model?: string) {
    this.model = model || MODEL;
    logger.info('Conversation Agent initialized', { model: this.model });
  }

  /**
   * Initialize conversation - generate initial questions and send first one
   */
  async initializeConversation(
    sessionId: string,
    selectedContexts?: string[],
    engineeringTaskTypes?: string[]
  ): Promise<InitializeResult> {
    const startTime = Date.now();

    try {
      logger.info('Initializing conversation', {
        sessionId,
        selectedContexts,
        engineeringTaskTypes,
      });

      await logAgentExecution({
        sessionId,
        agentName: 'conversation',
        status: 'running',
      });

      // Get session data and files
      const sessionResult = await getSessionData(sessionId);
      if (!sessionResult.success) {
        throw new Error(`Failed to get session: ${sessionResult.error}`);
      }

      const session = sessionResult.data;
      const problemStatement = session.problemStatement || 'No problem statement provided';

      // Use provided contexts or fall back to session data
      const contexts = selectedContexts || session.selectedContexts || [];
      const taskTypes = engineeringTaskTypes || session.engineeringTaskTypes || [];

      // Get file contents
      const filesResult = await getAllFileContents(sessionId);
      const files = filesResult.success ? filesResult.data || [] : [];

      // Build context prompt from selected contexts and task types
      const contextPrompt = await buildContextPrompt(contexts, taskTypes);

      // Generate initial questions using Claude with context
      const questions = await this.generateInitialQuestions(problemStatement, files, contextPrompt, taskTypes);

      // Save questions to QuestionQueue (NOT to Message table yet!)
      await this.saveQuestionsToQueue(sessionId, questions);

      // Get and send the first question
      const firstQuestion = await this.getNextQuestion(sessionId);

      const durationMs = Date.now() - startTime;

      await logAgentExecution({
        sessionId,
        agentName: 'conversation',
        status: 'completed',
        durationMs,
        metadata: { questionsGenerated: questions.length },
      });

      logger.info('Conversation initialized', {
        sessionId,
        questionsGenerated: questions.length,
        durationMs,
      });

      return {
        started: true,
        firstQuestion: firstQuestion || 'No questions to ask.',
        totalQuestions: questions.length,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      logger.error('Failed to initialize conversation', {
        sessionId,
        error: error.message,
        durationMs,
      });

      await logAgentExecution({
        sessionId,
        agentName: 'conversation',
        status: 'failed',
        durationMs,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Process user's answer and determine next action
   */
  async processAnswer(sessionId: string, answer: string): Promise<ConversationResult> {
    try {
      logger.info('Processing answer', { sessionId, answerLength: answer.length });

      // Get the current question (the one that was just answered)
      const currentQuestion = await prisma.questionQueue.findFirst({
        where: {
          sessionId,
          status: 'asked',
        },
        orderBy: { askedAt: 'desc' },
      });

      if (!currentQuestion) {
        throw new Error('No current question found');
      }

      // Save the answer
      await prisma.questionQueue.update({
        where: { id: currentQuestion.id },
        data: {
          answer,
          status: 'answered',
          answeredAt: new Date(),
        },
      });

      // Save answer as user message
      await prisma.message.create({
        data: {
          sessionId,
          role: 'user',
          content: answer,
          timestamp: new Date(),
        },
      });

      // Get context for evaluation
      const context = await this.getConversationContext(sessionId);

      // Evaluate the answer with Claude
      const evaluation = await this.evaluateAnswer(
        context.problemStatement,
        currentQuestion.question,
        answer,
        context.queuedQuestions,
        context.answeredQA
      );

      // Handle the evaluation result
      let nextQuestion: string | null = null;
      let isFollowUp = false;
      let isComplete = false;

      // Check total questions limit
      const totalQuestions = await prisma.questionQueue.count({
        where: { sessionId, status: { not: 'skipped' } }
      });
      const atLimit = totalQuestions >= MAX_TOTAL_QUESTIONS;

      if (atLimit) {
        logger.info('Question limit reached, completing conversation', {
          sessionId,
          totalQuestions,
          limit: MAX_TOTAL_QUESTIONS,
        });
        // Skip to completion if at limit
        evaluation.action = 'COMPLETE';
      }

      switch (evaluation.action) {
        case 'ASK_FOLLOW_UP':
          if (evaluation.followUpQuestion && !atLimit) {
            // Save follow-up to queue and send it (only if not at limit)
            await this.addFollowUpQuestion(sessionId, evaluation.followUpQuestion, currentQuestion.id);
            nextQuestion = await this.getNextQuestion(sessionId);
            isFollowUp = true;
          } else {
            // At limit, just get next existing question
            nextQuestion = await this.getNextQuestion(sessionId);
          }
          break;

        case 'NEXT_QUESTION':
          // Skip redundant questions if indicated
          if (evaluation.skipQuestionIndices && evaluation.skipQuestionIndices.length > 0) {
            await this.skipQuestions(sessionId, evaluation.skipQuestionIndices);
          }
          nextQuestion = await this.getNextQuestion(sessionId);
          break;

        case 'GENERATE_NEW':
          if (evaluation.newQuestions && evaluation.newQuestions.length > 0 && !atLimit) {
            // Only add new questions if not at limit
            const remainingSlots = MAX_TOTAL_QUESTIONS - totalQuestions;
            const limitedNewQuestions = evaluation.newQuestions.slice(0, remainingSlots);
            if (limitedNewQuestions.length > 0) {
              await this.addNewQuestions(sessionId, limitedNewQuestions);
            }
          }
          nextQuestion = await this.getNextQuestion(sessionId);
          break;

        case 'COMPLETE':
          isComplete = true;
          // Update session status
          await prisma.analysisSession.update({
            where: { id: sessionId },
            data: { status: 'questions_complete' },
          });
          break;
      }

      // Get progress
      const progress = await this.getProgress(sessionId);

      // Check if no more questions (natural completion)
      if (!nextQuestion && !isComplete) {
        isComplete = true;
        await prisma.analysisSession.update({
          where: { id: sessionId },
          data: { status: 'questions_complete' },
        });
      }

      logger.info('Answer processed', {
        sessionId,
        action: evaluation.action,
        hasNextQuestion: !!nextQuestion,
        isComplete,
        progress,
      });

      return {
        nextQuestion,
        isFollowUp,
        isComplete,
        progress,
        extractedInfo: evaluation.extractedInfo,
      };
    } catch (error: any) {
      logger.error('Failed to process answer', {
        sessionId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get the next question from the queue and send it
   */
  async getNextQuestion(sessionId: string): Promise<string | null> {
    // First, check for pending follow-ups (higher priority)
    let nextQ = await prisma.questionQueue.findFirst({
      where: {
        sessionId,
        status: 'pending',
        category: 'follow_up',
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // If no follow-ups, get next regular question
    if (!nextQ) {
      nextQ = await prisma.questionQueue.findFirst({
        where: {
          sessionId,
          status: 'pending',
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
      });
    }

    if (!nextQ) {
      return null;
    }

    // Mark as asked
    await prisma.questionQueue.update({
      where: { id: nextQ.id },
      data: {
        status: 'asked',
        askedAt: new Date(),
      },
    });

    // Save to Message table for UI display
    await prisma.message.create({
      data: {
        sessionId,
        role: 'assistant',
        content: nextQ.question,
        timestamp: new Date(),
      },
    });

    return nextQ.question;
  }

  /**
   * Generate initial questions using Claude with context awareness
   */
  private async generateInitialQuestions(
    problemStatement: string,
    files: any[],
    contextPrompt: string = '',
    taskTypes: string[] = []
  ): Promise<Array<{ question: string; category: string; priority: number }>> {
    const filesContent = files
      .map((f: any) => `=== File: ${f.fileName} ===\n${f.content}\n`)
      .join('\n\n');

    const taskTypesSection = taskTypes.length > 0
      ? `\n\nEngineering Task Types Selected:\n${taskTypes.map(t => `- ${t}`).join('\n')}\n\nGenerate questions specifically relevant to these task types.`
      : '';

    const userMessage = `Problem Statement:
${problemStatement}

Uploaded Files:
${filesContent || 'No files uploaded'}
${taskTypesSection}
${contextPrompt}

Generate exactly ${MAX_INITIAL_QUESTIONS} prioritized questions for this POC that are tailored to the selected engineering task types and context above.

IMPORTANT RULES:
1. Generate EXACTLY ${MAX_INITIAL_QUESTIONS} questions, no more, no less
2. Each question must be UNIQUE and cover a different aspect
3. Prioritize the most critical questions first
4. Avoid redundant or overlapping questions
5. Focus on information needed for POC generation

Return as JSON.`;

    logger.info('Generating context-aware questions', {
      hasContext: !!contextPrompt,
      taskTypes,
      promptLength: userMessage.length,
    });

    const response = await anthropic.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: INITIAL_QUESTIONS_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Extract text response
    let responseText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText = block.text;
      }
    }

    // Parse JSON from response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*"questions"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.questions || [];
      }
    } catch (e) {
      logger.warn('Failed to parse questions JSON, falling back to line parsing', {
        error: (e as Error).message,
      });
    }

    // Fallback: parse numbered list
    const lines = responseText.split('\n');
    const questions: Array<{ question: string; category: string; priority: number }> = [];
    let priority = 10;

    for (const line of lines) {
      const match = line.trim().match(/^\d+[.)]\s+(.+)$/);
      if (match) {
        questions.push({
          question: match[1].trim(),
          category: 'initial',
          priority: priority--,
        });
      }
    }

    return questions;
  }

  /**
   * Save questions to the queue (with limit enforcement)
   */
  private async saveQuestionsToQueue(
    sessionId: string,
    questions: Array<{ question: string; category: string; priority: number }>
  ): Promise<void> {
    // Enforce maximum initial questions limit
    const limitedQuestions = questions.slice(0, MAX_INITIAL_QUESTIONS);

    for (const q of limitedQuestions) {
      await prisma.questionQueue.create({
        data: {
          sessionId,
          question: q.question,
          category: q.category || 'initial',
          priority: q.priority,
          status: 'pending',
        },
      });
    }

    logger.info('Questions saved to queue', {
      sessionId,
      count: limitedQuestions.length,
      originalCount: questions.length,
      limited: questions.length > MAX_INITIAL_QUESTIONS,
    });
  }

  /**
   * Get conversation context for evaluation
   */
  private async getConversationContext(sessionId: string): Promise<{
    problemStatement: string;
    queuedQuestions: string[];
    answeredQA: Array<{ question: string; answer: string }>;
  }> {
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
    });

    const queuedQuestions = await prisma.questionQueue.findMany({
      where: {
        sessionId,
        status: 'pending',
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    const answeredQA = await prisma.questionQueue.findMany({
      where: {
        sessionId,
        status: 'answered',
      },
      orderBy: { answeredAt: 'asc' },
    });

    return {
      problemStatement: session?.problemStatement || 'No problem statement',
      queuedQuestions: queuedQuestions.map((q) => q.question),
      answeredQA: answeredQA.map((q) => ({
        question: q.question,
        answer: q.answer || '',
      })),
    };
  }

  /**
   * Evaluate user's answer with Claude
   */
  private async evaluateAnswer(
    problemStatement: string,
    currentQuestion: string,
    answer: string,
    queuedQuestions: string[],
    answeredQA: Array<{ question: string; answer: string }>
  ): Promise<ConversationEvaluation> {
    const previousQA = answeredQA
      .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
      .join('\n\n');

    const queuedList = queuedQuestions
      .map((q, i) => `${i}. ${q}`)
      .join('\n');

    const userMessage = `## Problem Statement
${problemStatement}

## Previous Q&A
${previousQA || 'None yet'}

## Current Question
${currentQuestion}

## User's Answer
${answer}

## Queued Questions (with indices)
${queuedList || 'None remaining'}

Evaluate this answer and determine the next action. Respond in JSON format.`;

    const response = await anthropic.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: CONVERSATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Extract text response
    let responseText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText = block.text;
      }
    }

    // Parse JSON
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ConversationEvaluation;
      }
    } catch (e) {
      logger.warn('Failed to parse evaluation JSON', {
        error: (e as Error).message,
        response: responseText.substring(0, 200),
      });
    }

    // Default fallback: move to next question
    return {
      extractedInfo: {
        keyFacts: [],
        preferences: [],
        newGaps: [],
      },
      answerQuality: 'complete',
      action: 'NEXT_QUESTION',
      reasoning: 'Failed to parse response, defaulting to next question',
    };
  }

  /**
   * Add a follow-up question to the queue
   */
  private async addFollowUpQuestion(
    sessionId: string,
    question: string,
    parentId: string
  ): Promise<void> {
    await prisma.questionQueue.create({
      data: {
        sessionId,
        question,
        category: 'follow_up',
        priority: 100, // High priority - ask immediately
        status: 'pending',
        parentId,
      },
    });

    logger.info('Follow-up question added', { sessionId, question });
  }

  /**
   * Add new questions to the queue
   */
  private async addNewQuestions(sessionId: string, questions: string[]): Promise<void> {
    let priority = 50; // Medium priority
    for (const q of questions) {
      await prisma.questionQueue.create({
        data: {
          sessionId,
          question: q,
          category: 'generated',
          priority: priority--,
          status: 'pending',
        },
      });
    }

    logger.info('New questions added', { sessionId, count: questions.length });
  }

  /**
   * Skip questions by their indices in the pending queue
   */
  private async skipQuestions(sessionId: string, indices: number[]): Promise<void> {
    const pendingQuestions = await prisma.questionQueue.findMany({
      where: {
        sessionId,
        status: 'pending',
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    for (const index of indices) {
      if (index >= 0 && index < pendingQuestions.length) {
        await prisma.questionQueue.update({
          where: { id: pendingQuestions[index].id },
          data: { status: 'skipped' },
        });
      }
    }

    logger.info('Questions skipped', { sessionId, skippedIndices: indices });
  }

  /**
   * Get conversation progress
   */
  private async getProgress(sessionId: string): Promise<{ asked: number; total: number }> {
    const total = await prisma.questionQueue.count({
      where: {
        sessionId,
        status: { not: 'skipped' },
      },
    });

    const asked = await prisma.questionQueue.count({
      where: {
        sessionId,
        status: { in: ['asked', 'answered'] },
      },
    });

    return { asked, total };
  }
}

// Export singleton instance
export const conversationAgent = new ConversationAgent();
