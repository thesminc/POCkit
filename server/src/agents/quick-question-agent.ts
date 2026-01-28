/**
 * Quick Question Agent
 *
 * Quickly generates clarifying questions based on problem statement and files.
 * NO web searches, NO tools - just fast question generation.
 */

import Anthropic from '@anthropic-ai/sdk';
import { QUICK_QUESTION_PROMPT } from './prompts/quick-question';
import { getSessionData, saveQuestionResponse, logAgentExecution } from './tools/database-tools';
import { getAllFileContents } from './tools/file-tools';
import { createLogger } from '../config/logger';

const logger = createLogger();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

export interface QuickQuestionOutput {
  questions: string[];
  rawResponse: string;
}

export class QuickQuestionAgent {
  private model: string;

  constructor(model?: string) {
    this.model = model || MODEL;
    logger.info('Quick Question Agent initialized', { model: this.model });
  }

  /**
   * Generate questions for a session - FAST (1 API call, no tools)
   */
  async generateQuestions(sessionId: string): Promise<QuickQuestionOutput> {
    const startTime = Date.now();

    try {
      logger.info('Starting quick question generation', { sessionId });

      // Log execution start
      await logAgentExecution({
        sessionId,
        agentName: 'quick_question',
        status: 'running',
      });

      // Get session data
      const sessionResult = await getSessionData(sessionId);
      if (!sessionResult.success) {
        throw new Error(`Failed to get session data: ${sessionResult.error}`);
      }

      const session = sessionResult.data;
      const problemStatement = session.problemStatement || 'No problem statement provided';

      // Get all file contents
      const filesResult = await getAllFileContents(sessionId);
      if (!filesResult.success) {
        throw new Error(`Failed to get files: ${filesResult.error}`);
      }

      const files = filesResult.data || [];

      // Build prompt with problem + files
      const userMessage = this.buildQuestionPrompt(problemStatement, files);

      logger.info('Calling Claude API for question generation', {
        sessionId,
        promptLength: userMessage.length,
        fileCount: files.length,
      });

      // Single API call - NO tools, NO web searches
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 2048, // Questions are short, don't need 8K
        system: QUICK_QUESTION_PROMPT,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      logger.info('Claude API response received', {
        sessionId,
        stopReason: response.stop_reason,
      });

      // Extract text response
      let responseText = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          responseText = block.text;
        }
      }

      // Parse questions
      const questions = this.parseQuestions(responseText);

      // Save questions to database
      await this.saveQuestionsToDb(sessionId, questions);

      const durationMs = Date.now() - startTime;

      // Log successful completion
      await logAgentExecution({
        sessionId,
        agentName: 'quick_question',
        status: 'completed',
        durationMs,
        metadata: { questionsGenerated: questions.length },
      });

      logger.info('Quick question generation completed successfully', {
        sessionId,
        durationMs,
        questionsCount: questions.length,
      });

      return {
        questions,
        rawResponse: responseText,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      logger.error('Quick question generation failed', {
        sessionId,
        error: error.message,
        durationMs,
      });

      // Log failure
      await logAgentExecution({
        sessionId,
        agentName: 'quick_question',
        status: 'failed',
        durationMs,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Build question generation prompt with problem statement and files
   */
  private buildQuestionPrompt(problemStatement: string, files: any[]): string {
    const filesContent = files
      .map(f => `=== File: ${f.fileName} ===\n${f.content}\n`)
      .join('\n\n');

    return `Problem Statement:
${problemStatement}

Uploaded Files:
${filesContent || 'No files uploaded'}

Analyze the problem statement and files above. Identify missing information needed for POC design.

Generate 5-8 specific, intelligent questions to fill these gaps. Return ONLY a numbered list of questions.`;
  }

  /**
   * Parse questions from response text
   */
  private parseQuestions(responseText: string): string[] {
    const lines = responseText.split('\n');
    const questions: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Match numbered questions: "1. Question?" or "1) Question?"
      const match = trimmed.match(/^(\d+)[.)]?\s+(.+)$/);
      if (match) {
        questions.push(match[2].trim());
      }
    }

    logger.info('Parsed questions from response', {
      questionsFound: questions.length,
    });

    return questions;
  }

  /**
   * Save questions to QuestionResponse table AND Message table for UI
   */
  private async saveQuestionsToDb(sessionId: string, questions: string[]): Promise<void> {
    logger.info('Saving questions to database', {
      sessionId,
      count: questions.length,
    });

    // Import prisma for Message creation
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      for (let i = 0; i < questions.length; i++) {
        // Save to QuestionResponse (for tracking)
        await saveQuestionResponse({
          sessionId,
          question: questions[i],
          order: i + 1,
        });

        // Save to Message (for UI display)
        await prisma.message.create({
          data: {
            sessionId,
            role: 'assistant',
            content: questions[i],
            timestamp: new Date()
          }
        });
      }

      logger.info('Questions saved to database (QuestionResponse and Message)', { sessionId });
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Export singleton instance
export const quickQuestionAgent = new QuickQuestionAgent();
