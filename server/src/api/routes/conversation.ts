import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { createLogger } from '../../config/logger';

const router = Router();
const logger = createLogger();

/**
 * Get question responses for a session
 * GET /api/conversation/sessions/:sessionId/questions
 */
router.get('/sessions/:sessionId/questions', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    logger.info('Getting questions for session', { sessionId });

    const questions = await prisma.questionResponse.findMany({
      where: { sessionId },
      orderBy: { order: 'asc' }
    });

    const unansweredQuestions = questions.filter(q => !q.answer);
    const answeredQuestions = questions.filter(q => q.answer);

    logger.info('Questions retrieved', {
      sessionId,
      total: questions.length,
      answered: answeredQuestions.length,
      unanswered: unansweredQuestions.length
    });

    res.json({
      success: true,
      questions,
      stats: {
        total: questions.length,
        answered: answeredQuestions.length,
        unanswered: unansweredQuestions.length
      }
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
 * Create a new question for a session
 * POST /api/conversation/sessions/:sessionId/questions
 */
router.post('/sessions/:sessionId/questions', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { question, order } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'question is required'
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

    const questionResponse = await prisma.questionResponse.create({
      data: {
        sessionId,
        question,
        order: order || 0
      }
    });

    logger.info('Question created', { sessionId, questionId: questionResponse.id });
    res.status(201).json({
      success: true,
      question: questionResponse
    });
  } catch (error: any) {
    logger.error('Failed to create question', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create question',
    });
  }
});

/**
 * Answer a question
 * PATCH /api/conversation/questions/:questionId/answer
 */
router.patch('/questions/:questionId/answer', async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;

    if (!answer || answer.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Answer is required',
      });
    }

    logger.info('Processing question answer', { questionId });

    const questionResponse = await prisma.questionResponse.update({
      where: { id: questionId },
      data: {
        answer,
        answeredAt: new Date()
      }
    });

    logger.info('Question answered', { questionId });
    res.json({
      success: true,
      question: questionResponse
    });
  } catch (error: any) {
    logger.error('Failed to answer question', {
      questionId: req.params.questionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to answer question',
    });
  }
});

/**
 * Delete a question
 * DELETE /api/conversation/questions/:questionId
 */
router.delete('/questions/:questionId', async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;

    await prisma.questionResponse.delete({
      where: { id: questionId }
    });

    logger.info('Question deleted', { questionId });
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete question', {
      questionId: req.params.questionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete question',
    });
  }
});

/**
 * Bulk create questions
 * POST /api/conversation/sessions/:sessionId/questions/bulk
 */
router.post('/sessions/:sessionId/questions/bulk', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'questions array is required and must not be empty'
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

    const questionData = questions.map((q, index) => ({
      sessionId,
      question: typeof q === 'string' ? q : q.question,
      order: typeof q === 'object' && q.order !== undefined ? q.order : index,
      answer: typeof q === 'object' ? q.answer : null
    }));

    await prisma.questionResponse.createMany({
      data: questionData
    });

    logger.info('Bulk questions created', { sessionId, count: questionData.length });
    res.status(201).json({
      success: true,
      message: `${questionData.length} questions created`,
      count: questionData.length
    });
  } catch (error: any) {
    logger.error('Failed to create bulk questions', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create questions',
    });
  }
});

/**
 * Get conversation progress for a session
 * GET /api/conversation/sessions/:sessionId/progress
 */
router.get('/sessions/:sessionId/progress', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const totalQuestions = await prisma.questionResponse.count({
      where: { sessionId }
    });

    const answeredQuestions = await prisma.questionResponse.count({
      where: {
        sessionId,
        answer: { not: null }
      }
    });

    const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    res.json({
      success: true,
      progress: {
        total: totalQuestions,
        answered: answeredQuestions,
        remaining: totalQuestions - answeredQuestions,
        percentComplete: Math.round(progress)
      }
    });
  } catch (error: any) {
    logger.error('Failed to get conversation progress', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get progress',
    });
  }
});

export default router;
