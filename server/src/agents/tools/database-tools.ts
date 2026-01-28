/**
 * Database Tools for Claude Agents
 * These tools allow agents to interact with the database
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../../config/logger';

const prisma = new PrismaClient();
const logger = createLogger();

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Save analysis result to database
 * Used by File Analysis Agent
 */
export async function saveAnalysisResult(params: {
  sessionId: string;
  category: string;
  finding: string;
  source?: string;
  confidence?: number;
}): Promise<ToolResult> {
  try {
    logger.info('Saving analysis result', {
      sessionId: params.sessionId,
      category: params.category,
    });

    const result = await prisma.analysisResult.create({
      data: {
        sessionId: params.sessionId,
        category: params.category,
        finding: params.finding,
        source: params.source || null,
        confidence: params.confidence || null,
      },
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    logger.error('Failed to save analysis result', {
      error: error.message,
      params,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Save AI solution recommendation to database
 * Used by File Analysis Agent
 */
export async function saveAISolution(params: {
  sessionId: string;
  name: string;
  description: string;
  category: string;
  provider?: string;
  url?: string;
  relevance?: number;
}): Promise<ToolResult> {
  try {
    logger.info('Saving AI solution recommendation', {
      sessionId: params.sessionId,
      name: params.name,
    });

    const result = await prisma.aISolutionRecommendation.create({
      data: {
        sessionId: params.sessionId,
        name: params.name,
        description: params.description,
        category: params.category,
        provider: params.provider || null,
        url: params.url || null,
        relevance: params.relevance || null,
      },
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    logger.error('Failed to save AI solution recommendation', {
      error: error.message,
      params,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get session data with all related information
 * Used by all agents
 */
export async function getSessionData(sessionId: string): Promise<ToolResult> {
  try {
    logger.info('Fetching session data', { sessionId });

    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
      include: {
        uploadedFiles: true,
        analysisResults: true,
        questionResponses: {
          orderBy: { order: 'asc' },
        },
        questionQueue: {
          orderBy: { createdAt: 'asc' },
        },
        aiSolutionRecommendations: {
          orderBy: { relevance: 'desc' },
        },
        generatedPocs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    return {
      success: true,
      data: session,
    };
  } catch (error: any) {
    logger.error('Failed to get session data', {
      error: error.message,
      sessionId,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Log agent execution for monitoring and debugging
 * Used by all agents
 */
export async function logAgentExecution(params: {
  sessionId: string;
  agentName: string;
  status: 'running' | 'completed' | 'failed';
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  errorMessage?: string;
  metadata?: any;
}): Promise<ToolResult> {
  try {
    const execution = await prisma.agentExecution.create({
      data: {
        sessionId: params.sessionId,
        agentName: params.agentName,
        status: params.status,
        completedAt: params.status !== 'running' ? new Date() : null,
        durationMs: params.durationMs || null,
        inputTokens: params.inputTokens || null,
        outputTokens: params.outputTokens || null,
        errorMessage: params.errorMessage || null,
        metadata: params.metadata || null,
      },
    });

    return {
      success: true,
      data: execution,
    };
  } catch (error: any) {
    logger.error('Failed to log agent execution', {
      error: error.message,
      params,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Save question responses
 * Used by Quick Question Agent
 */
export async function saveQuestionResponse(params: {
  sessionId: string;
  question: string;
  answer?: string;
  order: number;
}): Promise<ToolResult> {
  try {
    logger.info('Saving question response', {
      sessionId: params.sessionId,
      order: params.order,
    });

    const result = await prisma.questionResponse.create({
      data: {
        sessionId: params.sessionId,
        question: params.question,
        answer: params.answer || null,
        order: params.order,
        answeredAt: params.answer ? new Date() : null,
      },
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    logger.error('Failed to save question response', {
      error: error.message,
      params,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update question with answer
 * Used when user answers questions
 */
export async function updateQuestionAnswer(params: {
  questionId: string;
  answer: string;
}): Promise<ToolResult> {
  try {
    logger.info('Updating question answer', {
      questionId: params.questionId,
    });

    const result = await prisma.questionResponse.update({
      where: { id: params.questionId },
      data: {
        answer: params.answer,
        answeredAt: new Date(),
      },
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    logger.error('Failed to update question answer', {
      error: error.message,
      params,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Save generated POC to database
 * Used by POC Generation Agent
 */
export async function saveGeneratedPoc(params: {
  sessionId: string;
  content: string;
  wordCount: number;
  sectionCount: number;
  citationCount: number;
  generationTime: number;
}): Promise<ToolResult> {
  try {
    logger.info('Saving generated POC', {
      sessionId: params.sessionId,
      wordCount: params.wordCount,
    });

    const result = await prisma.generatedPoc.create({
      data: {
        sessionId: params.sessionId,
        content: params.content,
        wordCount: params.wordCount,
        sectionCount: params.sectionCount,
        citationCount: params.citationCount,
        generationTime: params.generationTime,
      },
    });

    // Update session status
    await prisma.analysisSession.update({
      where: { id: params.sessionId },
      data: {
        status: 'poc_generated',
        completedAt: new Date(),
      },
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    logger.error('Failed to save generated POC', {
      error: error.message,
      params,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}
