import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { createLogger } from '../../config/logger';
import { fileAnalysisAgent } from '../../agents/file-analysis-agent';
import { quickQuestionAgent } from '../../agents/quick-question-agent';
import { pocGenerationAgent } from '../../agents/poc-generation-agent';
import { conversationAgent } from '../../agents/conversation-agent';

const router = Router();
const logger = createLogger();

/**
 * Get agent executions for a session
 * GET /api/agents/sessions/:sessionId
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    logger.info('Getting agent executions for session', { sessionId });

    const executions = await prisma.agentExecution.findMany({
      where: { sessionId },
      orderBy: { startedAt: 'desc' }
    });

    res.json({
      success: true,
      executions,
      count: executions.length
    });
  } catch (error: any) {
    logger.error('Failed to get agent executions', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get agent executions',
    });
  }
});

/**
 * Get a specific agent execution
 * GET /api/agents/executions/:executionId
 */
router.get('/executions/:executionId', async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;

    const execution = await prisma.agentExecution.findUnique({
      where: { id: executionId },
      include: {
        session: true
      }
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Agent execution not found'
      });
    }

    res.json({
      success: true,
      execution
    });
  } catch (error: any) {
    logger.error('Failed to get agent execution', {
      executionId: req.params.executionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get agent execution',
    });
  }
});

/**
 * Create a new agent execution record
 * POST /api/agents/sessions/:sessionId/executions
 */
router.post('/sessions/:sessionId/executions', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { agentName, metadata } = req.body;

    if (!agentName) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'agentName is required'
      });
    }

    // Verify session exists
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Session not found'
      });
    }

    const execution = await prisma.agentExecution.create({
      data: {
        sessionId,
        agentName,
        status: 'running',
        metadata: metadata || null
      }
    });

    logger.info('Agent execution started', {
      sessionId,
      executionId: execution.id,
      agentName
    });

    res.status(201).json({
      success: true,
      execution
    });
  } catch (error: any) {
    logger.error('Failed to create agent execution', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create agent execution',
    });
  }
});

/**
 * Update agent execution (mark as completed or failed)
 * PATCH /api/agents/executions/:executionId
 */
router.patch('/executions/:executionId', async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;
    const { status, errorMessage, inputTokens, outputTokens, metadata } = req.body;

    const execution = await prisma.agentExecution.findUnique({
      where: { id: executionId }
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Agent execution not found'
      });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'completed' || status === 'failed') {
        updateData.completedAt = new Date();
        if (execution.startedAt) {
          updateData.durationMs = Date.now() - execution.startedAt.getTime();
        }
      }
    }
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;
    if (inputTokens !== undefined) updateData.inputTokens = inputTokens;
    if (outputTokens !== undefined) updateData.outputTokens = outputTokens;
    if (metadata !== undefined) updateData.metadata = metadata;

    const updatedExecution = await prisma.agentExecution.update({
      where: { id: executionId },
      data: updateData
    });

    logger.info('Agent execution updated', {
      executionId,
      status: updateData.status,
      durationMs: updateData.durationMs
    });

    res.json({
      success: true,
      execution: updatedExecution
    });
  } catch (error: any) {
    logger.error('Failed to update agent execution', {
      executionId: req.params.executionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update agent execution',
    });
  }
});

/**
 * Start conversational Q&A for a session
 * POST /api/agents/sessions/:sessionId/analyze
 *
 * Uses ConversationAgent to generate questions and send the first one.
 * Questions are asked ONE AT A TIME in a conversational flow.
 *
 * Body (optional):
 * - selectedContexts: string[] - IDs of context files to use
 * - engineeringTaskTypes: string[] - Selected task types (e.g., "codebase-analysis")
 */
router.post('/sessions/:sessionId/analyze', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { selectedContexts, engineeringTaskTypes } = req.body || {};

    logger.info('Starting conversational Q&A', {
      sessionId,
      selectedContexts,
      engineeringTaskTypes,
    });

    // Verify session exists
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Session not found'
      });
    }

    // Store selected contexts and task types in session
    if (selectedContexts || engineeringTaskTypes) {
      await prisma.analysisSession.update({
        where: { id: sessionId },
        data: {
          ...(selectedContexts && { selectedContexts }),
          ...(engineeringTaskTypes && { engineeringTaskTypes }),
        },
      });
    }

    // Use ConversationAgent to initialize conversation with context
    const result = await conversationAgent.initializeConversation(
      sessionId,
      selectedContexts,
      engineeringTaskTypes
    );

    logger.info('Conversation started', {
      sessionId,
      totalQuestions: result.totalQuestions,
      firstQuestion: result.firstQuestion.substring(0, 50),
    });

    res.json({
      success: true,
      data: {
        started: result.started,
        firstQuestion: result.firstQuestion,
        totalQuestions: result.totalQuestions,
      },
      message: `Conversation started with ${result.totalQuestions} initial questions. Answer them one at a time.`,
    });

  } catch (error: any) {
    logger.error('Failed to start conversation', {
      sessionId: req.params.sessionId,
      error: error.message,
    });

    // Create error message in conversation
    try {
      await prisma.message.create({
        data: {
          sessionId: req.params.sessionId,
          role: 'assistant',
          content: `❌ **Failed to start conversation:** ${error.message}\n\nPlease try again or contact support if the issue persists.`,
          timestamp: new Date()
        }
      });
    } catch (msgErr) {
      logger.error('Failed to create error message', { error: msgErr });
    }

    res.status(500).json({
      success: false,
      error: 'Conversation Start Failed',
      message: error.message,
    });
  }
});

/**
 * Legacy: Generate quick questions (batch mode) for backwards compatibility
 * POST /api/agents/sessions/:sessionId/quick-questions
 */
router.post('/sessions/:sessionId/quick-questions', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    logger.info('Quick question generation request (legacy)', { sessionId });

    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Session not found'
      });
    }

    // Use Quick Question Agent (legacy batch mode)
    const result = await quickQuestionAgent.generateQuestions(sessionId);

    res.json({
      success: true,
      data: {
        questions: result.questions,
        totalQuestions: result.questions.length,
      },
      message: `${result.questions.length} questions generated (batch mode).`,
    });

  } catch (error: any) {
    logger.error('Quick question generation failed', {
      sessionId: req.params.sessionId,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: 'Question Generation Failed',
      message: error.message,
    });
  }
});

/**
 * Trigger POC feasibility analysis generation for a session
 * POST /api/agents/sessions/:sessionId/generate-poc
 *
 * Body (optional):
 * - pocFormat: 'business' | 'developer' | 'both' (default: 'business')
 *
 * Note: Runs file analysis first (if not done), then generates POC
 */
router.post('/sessions/:sessionId/generate-poc', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { pocFormat = 'business' } = req.body || {};

    logger.info('POC generation requested', { sessionId, pocFormat });

    // Verify session exists
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
      include: {
        analysisResults: true,
        uploadedFiles: true
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Session not found'
      });
    }

    // Return success immediately, then run workflow in background
    res.json({
      success: true,
      message: `POC feasibility analysis started (format: ${pocFormat})`
    });

    // Run file analysis + POC generation workflow in background
    (async () => {
      try {
        // Check if file analysis has been run (by checking if we have analysis results)
        const needsFileAnalysis = session.uploadedFiles.length > 0 && session.analysisResults.length === 0;

        if (needsFileAnalysis) {
          // Create progress message
          await prisma.message.create({
            data: {
              sessionId,
              role: 'assistant',
              content: '🔍 **Analyzing uploaded files first...** This may take 2-4 minutes.',
              timestamp: new Date()
            }
          });

          logger.info('Running file analysis before POC generation', { sessionId });
          await fileAnalysisAgent.analyze(sessionId);

          // Update progress
          await prisma.message.create({
            data: {
              sessionId,
              role: 'assistant',
              content: '✅ **File analysis complete!** Now generating your POC document...',
              timestamp: new Date()
            }
          });
        } else {
          // Just show POC generation progress
          await prisma.message.create({
            data: {
              sessionId,
              role: 'assistant',
              content: '📝 **Generating POC document...** This will take 2-3 minutes.',
              timestamp: new Date()
            }
          });
        }

        // Generate POC with selected format
        logger.info('Running POC feasibility analysis', { sessionId, pocFormat });
        await pocGenerationAgent.generatePOC(sessionId, pocFormat);

        logger.info('POC feasibility analysis complete', { sessionId, pocFormat });

      } catch (error: any) {
        logger.error('POC generation workflow failed', {
          sessionId,
          error: error.message
        });

        // Create error message
        await prisma.message.create({
          data: {
            sessionId,
            role: 'assistant',
            content: `❌ **POC generation failed:** ${error.message}`,
            timestamp: new Date()
          }
        });
      }
    })();

  } catch (error: any) {
    logger.error('Failed to trigger POC generation', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to trigger POC generation',
    });
  }
});

/**
 * Get agent status for a session
 * GET /api/agents/sessions/:sessionId/status
 */
router.get('/sessions/:sessionId/status', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const latestExecution = await prisma.agentExecution.findFirst({
      where: { sessionId },
      orderBy: { startedAt: 'desc' }
    });

    if (!latestExecution) {
      return res.json({
        success: true,
        status: 'idle',
        message: 'No agent executions found'
      });
    }

    res.json({
      success: true,
      status: latestExecution.status,
      agentName: latestExecution.agentName,
      executionId: latestExecution.id,
      startedAt: latestExecution.startedAt,
      completedAt: latestExecution.completedAt
    });
  } catch (error: any) {
    logger.error('Failed to get agent status', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get agent status',
    });
  }
});

/**
 * Get agent execution statistics for a session
 * GET /api/agents/sessions/:sessionId/stats
 */
router.get('/sessions/:sessionId/stats', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const executions = await prisma.agentExecution.findMany({
      where: { sessionId }
    });

    const stats = {
      total: executions.length,
      running: executions.filter(e => e.status === 'running').length,
      completed: executions.filter(e => e.status === 'completed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      totalDurationMs: executions
        .filter(e => e.durationMs)
        .reduce((sum, e) => sum + (e.durationMs || 0), 0),
      totalInputTokens: executions
        .filter(e => e.inputTokens)
        .reduce((sum, e) => sum + (e.inputTokens || 0), 0),
      totalOutputTokens: executions
        .filter(e => e.outputTokens)
        .reduce((sum, e) => sum + (e.outputTokens || 0), 0),
      byAgent: executions.reduce((acc, e) => {
        if (!acc[e.agentName]) {
          acc[e.agentName] = {
            count: 0,
            completed: 0,
            failed: 0,
            totalDurationMs: 0
          };
        }
        acc[e.agentName].count++;
        if (e.status === 'completed') acc[e.agentName].completed++;
        if (e.status === 'failed') acc[e.agentName].failed++;
        if (e.durationMs) acc[e.agentName].totalDurationMs += e.durationMs;
        return acc;
      }, {} as Record<string, any>)
    };

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    logger.error('Failed to get agent execution stats', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get agent execution stats',
    });
  }
});

/**
 * Get generated questions for a session
 * GET /api/agents/sessions/:sessionId/questions
 */
router.get('/sessions/:sessionId/questions', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const questions = await prisma.questionResponse.findMany({
      where: { sessionId },
      orderBy: { order: 'asc' }
    });

    res.json({
      success: true,
      questions,
      count: questions.length
    });
  } catch (error: any) {
    logger.error('Failed to get questions', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get questions',
    });
  }
});

/**
 * Get next unanswered question for a session
 * GET /api/agents/sessions/:sessionId/next-question
 */
router.get('/sessions/:sessionId/next-question', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const nextQuestion = await prisma.questionResponse.findFirst({
      where: {
        sessionId,
        answer: null
      },
      orderBy: { order: 'asc' }
    });

    if (!nextQuestion) {
      return res.json({
        success: true,
        question: null,
        message: 'All questions have been answered'
      });
    }

    res.json({
      success: true,
      question: nextQuestion
    });
  } catch (error: any) {
    logger.error('Failed to get next question', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get next question',
    });
  }
});

/**
 * Submit answer to a question
 * POST /api/agents/sessions/:sessionId/answer
 */
router.post('/sessions/:sessionId/answer', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { questionId, answer } = req.body;

    if (!questionId || !answer) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'questionId and answer are required'
      });
    }

    // Verify question exists and belongs to this session
    const question = await prisma.questionResponse.findFirst({
      where: {
        id: questionId,
        sessionId
      }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Question not found for this session'
      });
    }

    // Update the question with the answer
    const updatedQuestion = await prisma.questionResponse.update({
      where: { id: questionId },
      data: { answer }
    });

    logger.info('Answer submitted', { sessionId, questionId });

    res.json({
      success: true,
      question: updatedQuestion
    });
  } catch (error: any) {
    logger.error('Failed to submit answer', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to submit answer',
    });
  }
});

/**
 * Execute complete agent flow (analyze files, generate questions, generate POC)
 * POST /api/agents/sessions/:sessionId/execute-complete-flow
 */
router.post('/sessions/:sessionId/execute-complete-flow', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Verify session exists
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Session not found'
      });
    }

    // Create agent execution record for the complete flow
    const execution = await prisma.agentExecution.create({
      data: {
        sessionId,
        agentName: 'complete-flow-agent',
        status: 'running',
        metadata: { flow: 'complete', steps: ['analyze', 'questions', 'poc'] }
      }
    });

    logger.info('Complete agent flow triggered', { sessionId, executionId: execution.id });

    // TODO: Implement actual agent orchestration logic
    // This should:
    // 1. Run file analysis
    // 2. Generate questions
    // 3. Wait for answers
    // 4. Generate POC

    res.json({
      success: true,
      message: 'Complete agent flow started',
      executionId: execution.id
    });
  } catch (error: any) {
    logger.error('Failed to execute complete flow', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to execute complete flow',
    });
  }
});

/**
 * Delete an agent execution
 * DELETE /api/agents/executions/:executionId
 */
router.delete('/executions/:executionId', async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;

    await prisma.agentExecution.delete({
      where: { id: executionId }
    });

    logger.info('Agent execution deleted', { executionId });
    res.json({
      success: true,
      message: 'Agent execution deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete agent execution', {
      executionId: req.params.executionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete agent execution',
    });
  }
});

export default router;
