import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { createLogger } from '../../config/logger';

const router = Router();
const logger = createLogger();

/**
 * GET /api/branches/:branchId
 * Get a specific branch
 */
router.get('/:branchId', async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        project: true,
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }

    res.json({
      success: true,
      branch,
    });
  } catch (error: any) {
    logger.error('Failed to get branch', {
      branchId: req.params.branchId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/branches/:branchId
 * Update branch metadata (name, description)
 */
router.patch('/:branchId', async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    const { name, description } = req.body;

    if (!name && description === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (name or description) must be provided',
      });
    }

    const updates: { name?: string; description?: string | null } = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;

    const branch = await prisma.branch.update({
      where: { id: branchId },
      data: updates
    });

    res.json({
      success: true,
      branch,
    });
  } catch (error: any) {
    logger.error('Failed to update branch', {
      branchId: req.params.branchId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/branches/:branchId
 * Delete a branch
 */
router.delete('/:branchId', async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;

    // Check if branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }

    // Delete the branch (cascades to sessions and all related data)
    await prisma.branch.delete({
      where: { id: branchId },
    });

    logger.info('Branch deleted', { branchId });
    res.json({
      success: true,
      message: 'Branch deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete branch', {
      branchId: req.params.branchId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/branches/:branchId/sessions
 * Create a new session for a branch
 */
router.post('/:branchId/sessions', async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    const { problemStatement } = req.body;

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }

    // Create new session
    const session = await prisma.analysisSession.create({
      data: {
        branchId,
        problemStatement: problemStatement || null,
        status: 'created'
      }
    });

    logger.info('Session created for branch', { branchId, sessionId: session.id });
    res.status(201).json({
      success: true,
      session,
    });
  } catch (error: any) {
    logger.error('Failed to create session', {
      branchId: req.params.branchId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/branches/:branchId/sessions
 * List all sessions for a branch
 */
router.get('/:branchId/sessions', async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;

    const sessions = await prisma.analysisSession.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedFiles: true,
        generatedPocs: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error: any) {
    logger.error('Failed to list sessions', {
      branchId: req.params.branchId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/branches/:branchId/compare
 * Compare branch with its default branch
 */
router.get('/:branchId/compare', async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        project: true,
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }

    // Simple comparison response
    res.json({
      success: true,
      comparison: {
        branchName: branch.name,
        projectName: branch.project.name,
        sessionCount: branch.sessions.length,
        message: 'Branch comparison data'
      }
    });
  } catch (error: any) {
    logger.error('Failed to compare branch', {
      branchId: req.params.branchId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/branches/:branchId/pocs
 * Get all POCs for a branch (across all sessions)
 */
router.get('/:branchId/pocs', async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }

    // Get all POCs from all sessions for this branch
    const sessions = await prisma.analysisSession.findMany({
      where: { branchId },
      select: { id: true }
    });

    const sessionIds = sessions.map(s => s.id);

    const pocs = await prisma.generatedPoc.findMany({
      where: {
        sessionId: { in: sessionIds }
      },
      include: {
        session: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      pocs,
      count: pocs.length
    });
  } catch (error: any) {
    logger.error('Failed to get POCs for branch', {
      branchId: req.params.branchId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/branches/:branch1Id/compare/:branch2Id
 * Compare two branches
 */
router.get('/:branch1Id/compare/:branch2Id', async (req: Request, res: Response) => {
  try {
    const { branch1Id, branch2Id } = req.params;

    const [branch1, branch2] = await Promise.all([
      prisma.branch.findUnique({
        where: { id: branch1Id },
        include: {
          project: true,
          sessions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.branch.findUnique({
        where: { id: branch2Id },
        include: {
          project: true,
          sessions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
    ]);

    if (!branch1 || !branch2) {
      return res.status(404).json({
        success: false,
        error: 'One or both branches not found',
      });
    }

    // Verify branches are from the same project
    if (branch1.projectId !== branch2.projectId) {
      return res.status(400).json({
        success: false,
        error: 'Branches must be from the same project',
      });
    }

    // Simple comparison response
    res.json({
      success: true,
      comparison: {
        branch1: {
          id: branch1.id,
          name: branch1.name,
          sessionCount: branch1.sessions.length
        },
        branch2: {
          id: branch2.id,
          name: branch2.name,
          sessionCount: branch2.sessions.length
        },
        projectName: branch1.project.name,
        message: 'Branch comparison data'
      }
    });
  } catch (error: any) {
    logger.error('Failed to compare branches', {
      branch1Id: req.params.branch1Id,
      branch2Id: req.params.branch2Id,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/branches/:branchId/generate-poc
 * Generate POC for branch
 */
router.post('/:branchId/generate-poc', async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }

    // Find or create session
    let session = await prisma.analysisSession.findFirst({
      where: { branchId },
      orderBy: { createdAt: 'desc' }
    });

    if (!session) {
      session = await prisma.analysisSession.create({
        data: {
          branchId,
          status: 'created'
        }
      });
    }

    logger.info('POC generation requested for branch', { branchId, sessionId: session.id });
    res.json({
      success: true,
      message: 'POC generation started',
      sessionId: session.id
    });
  } catch (error: any) {
    logger.error('Failed to generate POC', {
      branchId: req.params.branchId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
