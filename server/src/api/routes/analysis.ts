import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { createLogger } from '../../config/logger';

const router = Router();
const logger = createLogger();

/**
 * Get analysis results for a session
 * GET /api/analysis/sessions/:sessionId
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const results = await prisma.analysisResult.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      results,
      count: results.length
    });
  } catch (error: any) {
    logger.error('Failed to get analysis results', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Analysis Failed',
      message: error.message,
    });
  }
});

/**
 * Create analysis result
 * POST /api/analysis/sessions/:sessionId
 */
router.post('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { category, finding, source, confidence } = req.body;

    if (!category || !finding) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'category and finding are required'
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

    const result = await prisma.analysisResult.create({
      data: {
        sessionId,
        category,
        finding,
        source: source || null,
        confidence: confidence || null
      }
    });

    logger.info('Analysis result created', { sessionId, resultId: result.id });
    res.status(201).json({
      success: true,
      result
    });
  } catch (error: any) {
    logger.error('Failed to create analysis result', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Analysis Failed',
      message: error.message,
    });
  }
});

/**
 * Update analysis result
 * PATCH /api/analysis/:resultId
 */
router.patch('/:resultId', async (req: Request, res: Response) => {
  try {
    const { resultId } = req.params;
    const { category, finding, source, confidence } = req.body;

    const updateData: any = {};
    if (category) updateData.category = category;
    if (finding) updateData.finding = finding;
    if (source !== undefined) updateData.source = source;
    if (confidence !== undefined) updateData.confidence = confidence;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'At least one field to update is required'
      });
    }

    const result = await prisma.analysisResult.update({
      where: { id: resultId },
      data: updateData
    });

    logger.info('Analysis result updated', { resultId });
    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    logger.error('Failed to update analysis result', {
      resultId: req.params.resultId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Update Failed',
      message: error.message,
    });
  }
});

/**
 * Delete analysis result
 * DELETE /api/analysis/:resultId
 */
router.delete('/:resultId', async (req: Request, res: Response) => {
  try {
    const { resultId } = req.params;

    await prisma.analysisResult.delete({
      where: { id: resultId }
    });

    logger.info('Analysis result deleted', { resultId });
    res.json({
      success: true,
      message: 'Analysis result deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete analysis result', {
      resultId: req.params.resultId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Delete Failed',
      message: error.message,
    });
  }
});

/**
 * Get analysis results by category
 * GET /api/analysis/sessions/:sessionId/category/:category
 */
router.get('/sessions/:sessionId/category/:category', async (req: Request, res: Response) => {
  try {
    const { sessionId, category } = req.params;

    const results = await prisma.analysisResult.findMany({
      where: {
        sessionId,
        category
      },
      orderBy: { confidence: 'desc' }
    });

    res.json({
      success: true,
      results,
      count: results.length
    });
  } catch (error: any) {
    logger.error('Failed to get analysis results by category', {
      sessionId: req.params.sessionId,
      category: req.params.category,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Query Failed',
      message: error.message,
    });
  }
});

export default router;
