import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { createLogger } from '../../config/logger';
import { exporter } from '../../services/exporter';
import fs from 'fs';
import path from 'path';

const router = Router();
const logger = createLogger();

/**
 * GET /api/pocs/:pocId
 * Get a specific POC by ID
 */
router.get('/:pocId', async (req: Request, res: Response) => {
  try {
    const { pocId } = req.params;

    const poc = await prisma.generatedPoc.findUnique({
      where: { id: pocId },
      include: {
        session: true
      }
    });

    if (!poc) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'POC not found'
      });
    }

    res.json({
      success: true,
      poc
    });
  } catch (error: any) {
    logger.error('Failed to get POC', {
      pocId: req.params.pocId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get POC',
    });
  }
});

/**
 * PATCH /api/pocs/:pocId
 * Update a POC
 */
router.patch('/:pocId', async (req: Request, res: Response) => {
  try {
    const { pocId } = req.params;
    const { content } = req.body;

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'At least one field to update is required'
      });
    }

    const poc = await prisma.generatedPoc.update({
      where: { id: pocId },
      data: updateData
    });

    logger.info('POC updated', { pocId, fields: Object.keys(updateData) });
    res.json({
      success: true,
      poc
    });
  } catch (error: any) {
    logger.error('Failed to update POC', {
      pocId: req.params.pocId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update POC',
    });
  }
});

/**
 * GET /api/pocs/:pocId/download
 * Download POC as markdown file
 */
router.get('/:pocId/download', async (req: Request, res: Response) => {
  try {
    const { pocId } = req.params;

    const poc = await prisma.generatedPoc.findUnique({
      where: { id: pocId }
    });

    if (!poc) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'POC not found'
      });
    }

    const filename = `poc-${pocId.substring(0, 8)}.md`.replace(/[^a-z0-9.-]/gi, '_');

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(poc.content);
  } catch (error: any) {
    logger.error('Failed to download POC', {
      pocId: req.params.pocId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to download POC',
    });
  }
});

/**
 * POST /api/pocs/:pocId/export
 * Export POC to PDF format
 */
router.post('/:pocId/export', async (req: Request, res: Response) => {
  try {
    const { pocId } = req.params;
    const { format } = req.body;

    if (!format || format !== 'pdf') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Format must be "pdf"'
      });
    }

    const poc = await prisma.generatedPoc.findUnique({
      where: { id: pocId }
    });

    if (!poc) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'POC not found'
      });
    }

    logger.info('POC export requested', { pocId, format });

    // Export to PDF using exporter service
    const result = await exporter.exportPOC({ pocId, format: 'pdf' });

    // Read the file and send as response
    const fileBuffer = fs.readFileSync(result.filePath);

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.send(fileBuffer);

    logger.info('POC exported successfully', { pocId, format, fileName: result.fileName });
  } catch (error: any) {
    logger.error('Failed to export POC', {
      pocId: req.params.pocId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to export POC: ' + error.message,
    });
  }
});

/**
 * DELETE /api/pocs/:pocId
 * Delete a POC
 */
router.delete('/:pocId', async (req: Request, res: Response) => {
  try {
    const { pocId } = req.params;

    await prisma.generatedPoc.delete({
      where: { id: pocId }
    });

    logger.info('POC deleted', { pocId });
    res.json({
      success: true,
      message: 'POC deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete POC', {
      pocId: req.params.pocId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete POC',
    });
  }
});

export default router;
