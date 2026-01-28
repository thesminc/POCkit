import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { createLogger } from '../../config/logger';

const router = Router();
const logger = createLogger();

// Create a new project
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'name is required'
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description
      }
    });

    logger.info('Project created', { projectId: project.id, name });
    res.status(201).json({ success: true, project });
  } catch (error: any) {
    logger.error('Failed to create project', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create project'
    });
  }
});

// Get project by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        branches: {
          include: {
            sessions: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Project not found'
      });
    }

    res.json({ success: true, project });
  } catch (error: any) {
    logger.error('Failed to fetch project', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch project'
    });
  }
});

// List all projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        branches: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, projects });
  } catch (error: any) {
    logger.error('Failed to list projects', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to list projects'
    });
  }
});

// Update a project
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'At least one field to update is required'
      });
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData
    });

    logger.info('Project updated', { projectId: id, fields: Object.keys(updateData) });
    res.json({ success: true, project });
  } catch (error: any) {
    logger.error('Failed to update project', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update project'
    });
  }
});

// Create a new branch for a project
router.post('/:id/branches', async (req: Request, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'name is required'
      });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Project not found'
      });
    }

    const branch = await prisma.branch.create({
      data: {
        projectId,
        name,
        description
      }
    });

    logger.info('Branch created', { branchId: branch.id, projectId, name });
    res.status(201).json({ success: true, branch });
  } catch (error: any) {
    logger.error('Failed to create branch', { error: error.message });

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'A branch with this name already exists in the project'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create branch'
    });
  }
});

// List branches for a project
router.get('/:id/branches', async (req: Request, res: Response) => {
  try {
    const { id: projectId } = req.params;

    const branches = await prisma.branch.findMany({
      where: { projectId },
      include: {
        sessions: {
          select: { id: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, branches });
  } catch (error: any) {
    logger.error('Failed to list branches', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to list branches'
    });
  }
});

// Compare two branches within a project
router.get('/:projectId/compare/:sourceBranch/:targetBranch', async (req: Request, res: Response) => {
  try {
    const { projectId, sourceBranch, targetBranch } = req.params;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Project not found'
      });
    }

    // Get both branches
    const [source, target] = await Promise.all([
      prisma.branch.findFirst({
        where: {
          projectId,
          name: sourceBranch
        },
        include: {
          sessions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.branch.findFirst({
        where: {
          projectId,
          name: targetBranch
        },
        include: {
          sessions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
    ]);

    if (!source || !target) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'One or both branches not found'
      });
    }

    // Simple comparison response
    res.json({
      success: true,
      comparison: {
        projectName: project.name,
        source: {
          id: source.id,
          name: source.name,
          sessionCount: source.sessions.length
        },
        target: {
          id: target.id,
          name: target.name,
          sessionCount: target.sessions.length
        },
        message: 'Branch comparison data'
      }
    });
  } catch (error: any) {
    logger.error('Failed to compare branches', {
      projectId: req.params.projectId,
      sourceBranch: req.params.sourceBranch,
      targetBranch: req.params.targetBranch,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to compare branches'
    });
  }
});

// Delete a project and all associated data
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Project not found'
      });
    }

    // Cascade delete will handle all related data:
    // - Branches (onDelete: Cascade)
    // - Sessions (via branches cascade)
    // - All session-related data (via sessions cascade)
    await prisma.project.delete({
      where: { id },
    });

    logger.info('Project deleted', { projectId: id, projectName: project.name });
    res.json({
      success: true,
      message: 'Project and all associated data deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete project', {
      projectId: req.params.id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete project'
    });
  }
});

export default router;
