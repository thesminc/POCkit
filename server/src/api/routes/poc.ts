/**
 * POC Generation API Routes
 * RESTful endpoints for the complete POC generation workflow
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../../config/logger';
import { quickQuestionAgent } from '../../agents/quick-question-agent';
import { updateQuestionAnswer } from '../../agents/tools/database-tools';
import { extractTextFromDOCX, extractTextFromPDF, extractTextFromTXT } from '../../agents/tools/file-tools';

const router = express.Router();
const prisma = new PrismaClient();
const logger = createLogger();

/**
 * GET /api/projects
 * Get all projects
 */
router.get('/projects', async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        branches: {
          include: {
            sessions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      projects,
    });
  } catch (error: any) {
    logger.error('Failed to get projects', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/projects', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required',
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
      },
    });

    logger.info('Project created', { projectId: project.id, name });

    res.json({
      success: true,
      project,
    });
  } catch (error: any) {
    logger.error('Failed to create project', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/projects/:projectId
 * Get project by ID
 */
router.get('/projects/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        branches: {
          include: {
            sessions: {
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    res.json({
      success: true,
      project,
    });
  } catch (error: any) {
    logger.error('Failed to get project', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/projects/:projectId/branches
 * Get all branches for a project
 */
router.get('/projects/:projectId/branches', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const branches = await prisma.branch.findMany({
      where: { projectId },
      include: {
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      branches,
    });
  } catch (error: any) {
    logger.error('Failed to get branches', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/projects/:projectId/branches
 * Create a new branch
 */
router.post('/projects/:projectId/branches', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Branch name is required',
      });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Create branch
    const branch = await prisma.branch.create({
      data: {
        projectId,
        name,
        description: description || null,
      },
    });

    logger.info('Branch created', { branchId: branch.id, projectId, name });

    res.json({
      success: true,
      branch,
    });
  } catch (error: any) {
    logger.error('Failed to create branch', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/branches/:branchId
 * Get branch by ID
 */
router.get('/branches/:branchId', async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        project: true,
        sessions: {
          include: {
            uploadedFiles: true,
            questionResponses: true,
            analysisResults: true,
            aiSolutionRecommendations: true,
            generatedPocs: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
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
    logger.error('Failed to get branch', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.docx', '.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed: ${allowedTypes.join(', ')}`));
    }
  },
});

/**
 * POST /api/sessions/create
 * Create a new analysis session
 */
router.post('/sessions/create', async (req: Request, res: Response) => {
  try {
    const { projectName, branchName, problemStatement } = req.body;

    logger.info('Creating new session', { projectName, branchName });

    // Create project if doesn't exist
    let project = await prisma.project.findFirst({
      where: { name: projectName },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: projectName,
          description: `Project for ${projectName}`,
        },
      });
    }

    // Create branch if doesn't exist
    let branch = await prisma.branch.findFirst({
      where: {
        projectId: project.id,
        name: branchName,
      },
    });

    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          projectId: project.id,
          name: branchName,
          description: `Branch for ${branchName}`,
        },
      });
    }

    // Create analysis session
    const session = await prisma.analysisSession.create({
      data: {
        branchId: branch.id,
        problemStatement: problemStatement || null,
        status: 'created',
      },
    });

    logger.info('Session created successfully', {
      sessionId: session.id,
      projectName,
      branchName,
    });

    res.json({
      success: true,
      sessionId: session.id,
      projectId: project.id,
      branchId: branch.id,
    });
  } catch (error: any) {
    logger.error('Failed to create session', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/sessions/:sessionId/upload
 * Upload files for analysis
 */
router.post('/sessions/:sessionId/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    logger.info('Processing file uploads', {
      sessionId,
      fileCount: files.length,
    });

    const uploadedFiles = [];

    for (const file of files) {
      // Extract text content based on file type
      const ext = path.extname(file.originalname).toLowerCase();
      let content = '';

      try {
        if (ext === '.docx') {
          content = await extractTextFromDOCX(file.path);
        } else if (ext === '.pdf') {
          content = await extractTextFromPDF(file.path);
        } else {
          content = await extractTextFromTXT(file.path);
        }
      } catch (error: any) {
        logger.warn('Failed to extract text from file', {
          fileName: file.originalname,
          error: error.message,
        });
        content = 'Failed to extract text content';
      }

      // Save to database
      const uploadedFile = await prisma.uploadedFile.create({
        data: {
          sessionId,
          fileName: file.originalname,
          filePath: file.path,
          fileType: ext.substring(1), // Remove leading dot
          fileSize: file.size,
          content,
        },
      });

      uploadedFiles.push({
        id: uploadedFile.id,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        fileType: uploadedFile.fileType,
      });
    }

    // Update session status
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { status: 'files_uploaded' },
    });

    logger.info('Files uploaded successfully', {
      sessionId,
      uploadedCount: uploadedFiles.length,
    });

    res.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error: any) {
    logger.error('Failed to upload files', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/sessions/:sessionId/questions
 * Generate questions using Quick Question Agent
 */
router.post('/sessions/:sessionId/questions', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    logger.info('Generating questions', { sessionId });

    const result = await quickQuestionAgent.generateQuestions(sessionId);

    // Update session status
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { status: 'questions_generated' },
    });

    res.json({
      success: true,
      questions: result.questions,
    });
  } catch (error: any) {
    logger.error('Failed to generate questions', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/sessions/:sessionId/questions
 * Get all questions for a session
 */
router.get('/sessions/:sessionId/questions', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const questions = await prisma.questionResponse.findMany({
      where: { sessionId },
      orderBy: { order: 'asc' },
    });

    res.json({
      success: true,
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        order: q.order,
        answeredAt: q.answeredAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to get questions', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/sessions/:sessionId/questions/:questionId/answer
 * Answer a specific question
 */
router.post('/sessions/:sessionId/questions/:questionId/answer', async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;

    if (!answer) {
      return res.status(400).json({
        success: false,
        error: 'Answer is required',
      });
    }

    logger.info('Saving question answer', { questionId });

    const result = await updateQuestionAnswer({
      questionId,
      answer,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    res.json({
      success: true,
      question: result.data,
    });
  } catch (error: any) {
    logger.error('Failed to save answer', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/sessions/:sessionId/analyze
 * Run File Analysis Agent
 */
router.post('/sessions/:sessionId/analyze', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    logger.info('Starting file analysis', { sessionId });

    // Import dynamically to avoid circular dependencies
    const { fileAnalysisAgent } = await import('../../agents/file-analysis-agent');

    const result = await fileAnalysisAgent.analyze(sessionId);

    // Update session status
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { status: 'analyzed' },
    });

    res.json({
      success: true,
      analysis: {
        resultsCount: result.techStack?.current?.length || 0,
        aiSolutionsCount: result.discoveredAISolutions?.length || 0,
      },
    });
  } catch (error: any) {
    logger.error('Failed to analyze session', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/sessions/:sessionId/generate-poc
 * Generate POC using POC Generation Agent
 */
router.post('/sessions/:sessionId/generate-poc', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    logger.info('Starting POC generation', { sessionId });

    // Import dynamically to avoid circular dependencies
    const { pocGenerationAgent } = await import('../../agents/poc-generation-agent');

    const result = await pocGenerationAgent.generatePOC(sessionId);

    res.json({
      success: true,
      poc: {
        content: result.content,
        wordCount: result.wordCount || 0,
        citations: result.citations || 0,
        includedSections: result.includedSections || [],
      },
    });
  } catch (error: any) {
    logger.error('Failed to generate POC', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/sessions/:sessionId/poc
 * Get the generated POC
 */
router.get('/sessions/:sessionId/poc', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const poc = await prisma.generatedPoc.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    if (!poc) {
      return res.status(404).json({
        success: false,
        error: 'POC not found',
      });
    }

    res.json({
      success: true,
      poc: {
        id: poc.id,
        content: poc.content,
        wordCount: poc.wordCount,
        sectionCount: poc.sectionCount,
        citationCount: poc.citationCount,
        generationTime: poc.generationTime,
        createdAt: poc.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get POC', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/sessions/:sessionId
 * Get session details
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
      include: {
        uploadedFiles: true,
        questionResponses: {
          orderBy: { order: 'asc' },
        },
        analysisResults: true,
        aiSolutionRecommendations: true,
        generatedPocs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        problemStatement: session.problemStatement,
        createdAt: session.createdAt,
        completedAt: session.completedAt,
        filesCount: session.uploadedFiles.length,
        questionsCount: session.questionResponses.length,
        analysisResultsCount: session.analysisResults.length,
        aiSolutionsCount: session.aiSolutionRecommendations.length,
        hasPOC: session.generatedPocs.length > 0,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get session', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
