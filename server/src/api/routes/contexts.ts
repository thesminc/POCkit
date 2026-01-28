import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../../config/logger';

const router = Router();
const logger = createLogger();

// Path to context files directory
const CONTEXT_DIR = path.join(__dirname, '../../../..', 'context');

/**
 * GET /api/contexts
 * List all available .md context files
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('Fetching available context files');

    // Read all files in context directory
    const files = await fs.readdir(CONTEXT_DIR);

    // Filter for .md files only
    const mdFiles = files.filter(file => file.endsWith('.md'));

    // Get file details
    const contextFiles = await Promise.all(
      mdFiles.map(async (filename) => {
        const filePath = path.join(CONTEXT_DIR, filename);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');

        // Extract title from first # heading or use filename
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : filename.replace('.md', '');

        // Extract description from first paragraph after title
        const descMatch = content.match(/^#\s+.+$\n\n(.+?)(\n\n|$)/ms);
        const description = descMatch ? descMatch[1].trim() : 'No description available';

        return {
          id: filename.replace('.md', ''),
          filename,
          title,
          description,
          size: stats.size,
          lastModified: stats.mtime,
        };
      })
    );

    logger.info('Context files retrieved', { count: contextFiles.length });

    res.json({
      success: true,
      contexts: contextFiles,
    });
  } catch (error: any) {
    logger.error('Failed to fetch context files', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch context files',
      message: error.message,
    });
  }
});

/**
 * GET /api/contexts/:filename
 * Get content of a specific context file
 */
router.get('/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    // Security: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename',
      });
    }

    // Ensure .md extension
    const safeFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
    const filePath = path.join(CONTEXT_DIR, safeFilename);

    logger.info('Fetching context file', { filename: safeFilename });

    const content = await fs.readFile(filePath, 'utf-8');

    res.json({
      success: true,
      filename: safeFilename,
      content,
    });
  } catch (error: any) {
    logger.error('Failed to fetch context file', {
      filename: req.params.filename,
      error: error.message,
    });
    res.status(404).json({
      success: false,
      error: 'Context file not found',
      message: error.message,
    });
  }
});

export default router;
