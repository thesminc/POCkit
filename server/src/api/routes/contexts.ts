import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../../config/logger';
import { codeContextAgent } from '../../agents/code-context-agent';

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

/**
 * POST /api/contexts/generate/:sessionId
 * Generate a context file from uploaded code files
 * Phase 3 Enhancement: Code Context Agent
 */
router.post('/generate/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    logger.info('Starting code context generation', { sessionId });

    const result = await codeContextAgent.generateContext(sessionId);

    res.json({
      success: true,
      message: 'Context file generated successfully',
      ...result,
    });
  } catch (error: any) {
    logger.error('Code context generation failed', {
      sessionId: req.params.sessionId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to generate context file',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/contexts/user/:contextId
 * Delete a user-generated context file
 */
router.delete('/user/:contextId', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;

    // Only allow deleting user-generated contexts
    if (!contextId.startsWith('context_user_')) {
      return res.status(400).json({
        success: false,
        error: 'Can only delete user-generated context files',
      });
    }

    const deleted = await codeContextAgent.deleteContext(contextId);

    if (deleted) {
      res.json({
        success: true,
        message: 'Context file deleted',
        contextId,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Context file not found or could not be deleted',
      });
    }
  } catch (error: any) {
    logger.error('Failed to delete context file', {
      contextId: req.params.contextId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete context file',
      message: error.message,
    });
  }
});

/**
 * GET /api/contexts/user
 * List all user-generated context files
 */
router.get('/user', async (req: Request, res: Response) => {
  try {
    const userContexts = await codeContextAgent.listUserContexts();

    res.json({
      success: true,
      contexts: userContexts,
      count: userContexts.length,
    });
  } catch (error: any) {
    logger.error('Failed to list user contexts', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to list user contexts',
      message: error.message,
    });
  }
});

export default router;
