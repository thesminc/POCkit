/**
 * Export API Routes
 * Handles POC export to various formats (Markdown, PDF)
 */

import { Router, Request, Response } from 'express';
import { exporter, ExportRequest } from '../../services/exporter';
import { createLogger } from '../../config/logger';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const logger = createLogger();

/**
 * POST /api/export
 * Export a POC to specified format
 * Body: { pocId: string, format: 'markdown' | 'powerpoint' | 'pdf' }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { pocId, format } = req.body as ExportRequest;

    if (!pocId) {
      return res.status(400).json({ error: 'pocId is required' });
    }

    if (!format || !['markdown', 'pdf'].includes(format)) {
      return res.status(400).json({
        error: 'Invalid format. Must be one of: markdown, pdf',
      });
    }

    logger.info('Export request received', { pocId, format });

    const result = await exporter.exportPOC({ pocId, format });

    res.json({
      success: true,
      fileName: result.fileName,
      mimeType: result.mimeType,
      fileSize: result.fileSize,
      downloadUrl: `/api/export/download/${encodeURIComponent(result.fileName)}`,
    });
  } catch (error: any) {
    logger.error('Export failed', { error: error.message });

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Export failed', details: error.message });
  }
});

/**
 * GET /api/export/download/:fileName
 * Download an exported file
 */
router.get('/download/:fileName', async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(exporter.getExportDir(), fileName);

    // Security check - prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    const exportDir = path.resolve(exporter.getExportDir());

    if (!resolvedPath.startsWith(exportDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    // Determine content type
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.md': 'text/markdown',
      '.pdf': 'application/pdf',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileContent = await fs.readFile(filePath);
    res.send(fileContent);

    logger.info('File downloaded', { fileName });
  } catch (error: any) {
    logger.error('Download failed', { error: error.message });
    res.status(500).json({ error: 'Download failed' });
  }
});

/**
 * GET /api/export/formats
 * List available export formats
 */
router.get('/formats', (req: Request, res: Response) => {
  res.json({
    formats: [
      {
        id: 'markdown',
        name: 'Markdown',
        extension: '.md',
        mimeType: 'text/markdown',
        description: 'Plain text markdown format',
      },
      {
        id: 'pdf',
        name: 'PDF',
        extension: '.pdf',
        mimeType: 'application/pdf',
        description: 'Professional PDF document with styling',
      },
    ],
  });
});

/**
 * DELETE /api/export/cleanup
 * Clean up old export files (admin endpoint)
 */
router.delete('/cleanup', async (req: Request, res: Response) => {
  try {
    const { olderThanDays = 7 } = req.query;
    const days = parseInt(olderThanDays as string, 10);

    if (isNaN(days) || days < 1) {
      return res.status(400).json({ error: 'Invalid olderThanDays parameter' });
    }

    const deletedCount = await exporter.cleanupExports(days);

    res.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} files older than ${days} days`,
    });
  } catch (error: any) {
    logger.error('Cleanup failed', { error: error.message });
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

export default router;
