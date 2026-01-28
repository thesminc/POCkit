import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { createLogger } from '../../config/logger';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromDOCX, extractTextFromPDF, extractTextFromTXT } from '../../agents/tools/file-tools';
import { conversationAgent } from '../../agents/conversation-agent';

const router = Router();
const logger = createLogger();

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

// Get or create an analysis session for a branch
router.post('/', async (req: Request, res: Response) => {
  try {
    const { branchId, forceNew } = req.body;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'branchId is required'
      });
    }

    // If forceNew is true, create a new session
    // Otherwise, try to find an existing active session for this branch
    let session: any = null;

    if (!forceNew) {
      // Find the most recent active session for this branch
      // Match any session that is still in progress (not just 'created')
      session = await prisma.analysisSession.findFirst({
        where: {
          branchId,
          status: {
            in: ['created', 'questions_generated', 'questions_complete', 'analyzed', 'poc_generated']
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          uploadedFiles: true,
          generatedPocs: true, // Include POCs so history is accessible
        }
      });

      logger.info('Session lookup result', {
        branchId,
        foundSession: !!session,
        sessionId: session?.id,
        sessionStatus: session?.status,
        pocCount: session?.generatedPocs?.length || 0,
      });
    }

    // If no existing session found, or forceNew requested, create a new one
    if (!session) {
      // If forceNew, find the most recent session to copy problem statement and files
      let previousSession = null;
      if (forceNew) {
        previousSession = await prisma.analysisSession.findFirst({
          where: {
            branchId,
          },
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            uploadedFiles: true,
          }
        });
      }

      session = await prisma.analysisSession.create({
        data: {
          branchId,
          status: 'created',
          problemStatement: previousSession?.problemStatement || null,
        },
        include: {
          uploadedFiles: true,
        }
      });

      // Copy uploaded files from previous session if it exists
      if (previousSession && previousSession.uploadedFiles.length > 0) {
        const filesToCopy = previousSession.uploadedFiles.map(file => ({
          sessionId: session.id,
          fileName: file.fileName,
          filePath: file.filePath,
          fileType: file.fileType,
          fileSize: file.fileSize,
          content: file.content,
        }));

        await prisma.uploadedFile.createMany({
          data: filesToCopy,
        });

        // Reload session with copied files
        session = await prisma.analysisSession.findUnique({
          where: { id: session.id },
          include: { uploadedFiles: true },
        });
      }

      logger.info('New analysis session created', {
        sessionId: session.id,
        branchId,
        copiedFromPrevious: !!previousSession
      });
    } else {
      logger.info('Reusing existing session', { sessionId: session.id, branchId });
    }

    res.status(201).json({ success: true, session });
  } catch (error: any) {
    logger.error('Failed to get/create session', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get/create session'
    });
  }
});

// Get session details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = await prisma.analysisSession.findUnique({
      where: { id },
      include: {
        uploadedFiles: true,
        analysisResults: true,
        questionResponses: {
          orderBy: { createdAt: 'asc' }
        },
        aiSolutionRecommendations: true,
        generatedPocs: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found'
      });
    }

    res.json(session);
  } catch (error: any) {
    logger.error('Failed to fetch session', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch session'
    });
  }
});

// Update session (problemStatement, status)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;
    const { problemStatement, status } = req.body;

    const updateData: any = {};
    if (problemStatement !== undefined) updateData.problemStatement = problemStatement;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'At least one field to update is required (problemStatement or status)'
      });
    }

    const session = await prisma.analysisSession.update({
      where: { id: sessionId },
      data: updateData
    });

    logger.info('Session updated', { sessionId, fields: Object.keys(updateData) });
    res.json({ success: true, session });
  } catch (error: any) {
    logger.error('Failed to update session', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update session'
    });
  }
});

// Update session problem statement (legacy endpoint)
router.patch('/:id/problem-statement', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;
    const { problemStatement } = req.body;

    if (!problemStatement || !problemStatement.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'problemStatement is required'
      });
    }

    const session = await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { problemStatement }
    });

    logger.info('Problem statement updated', { sessionId });
    res.json({ success: true, session });
  } catch (error: any) {
    logger.error('Failed to update problem statement', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update problem statement'
    });
  }
});

// Get question responses for a session
router.get('/:id/questions', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;

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
    logger.error('Failed to fetch questions', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch questions'
    });
  }
});

// Get analysis results for a session
router.get('/:id/analysis', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;

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
    logger.error('Failed to fetch analysis results', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch analysis results'
    });
  }
});

// Get AI solution recommendations for a session
router.get('/:id/ai-solutions', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    const solutions = await prisma.aISolutionRecommendation.findMany({
      where: { sessionId },
      orderBy: { relevance: 'desc' }
    });

    res.json({
      success: true,
      solutions,
      count: solutions.length
    });
  } catch (error: any) {
    logger.error('Failed to fetch AI solutions', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch AI solutions'
    });
  }
});

// Upload files to a session
router.post('/:id/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;
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

// Get agent executions for a session
router.get('/:id/agents', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;

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
    logger.error('Failed to get agent executions', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get agent executions'
    });
  }
});

// Get conversation messages for a session
// Returns messages array directly (like old working version)
router.get('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });

    // Return messages array directly (NOT wrapped in object) - matches old working API
    res.json(messages);
  } catch (error: any) {
    logger.error('Failed to get conversation messages', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get conversation messages'
    });
  }
});

// Get POCs for a session
router.get('/:id/pocs', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    const pocs = await prisma.generatedPoc.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      pocs,
      count: pocs.length
    });
  } catch (error: any) {
    logger.error('Failed to get POCs', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get POCs'
    });
  }
});

// Server-Sent Events endpoint for real-time session updates
router.get('/:id/events', async (req: Request, res: Response) => {
  const { id: sessionId } = req.params;

  // Verify session exists
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Session not found'
    });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

  // Send periodic heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
  }, 30000); // Every 30 seconds

  // Poll for updates every 5 seconds (reduced from 2s to minimize load)
  const pollInterval = setInterval(async () => {
    try {
      // Get latest agent execution status
      const latestExecution = await prisma.agentExecution.findFirst({
        where: { sessionId },
        orderBy: { startedAt: 'desc' }
      });

      if (latestExecution) {
        res.write(`data: ${JSON.stringify({
          type: 'agent_status',
          data: {
            agentName: latestExecution.agentName,
            status: latestExecution.status,
            executionId: latestExecution.id,
            startedAt: latestExecution.startedAt,
            completedAt: latestExecution.completedAt
          }
        })}\n\n`);
      }

      // Get session status
      const currentSession = await prisma.analysisSession.findUnique({
        where: { id: sessionId },
        include: {
          questionResponses: { orderBy: { createdAt: 'desc' }, take: 1 },
          analysisResults: { orderBy: { createdAt: 'desc' }, take: 1 },
          generatedPocs: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      });

      if (currentSession) {
        res.write(`data: ${JSON.stringify({
          type: 'session_update',
          data: {
            status: currentSession.status,
            questionCount: currentSession.questionResponses.length,
            analysisCount: currentSession.analysisResults.length,
            pocCount: currentSession.generatedPocs.length
          }
        })}\n\n`);
      }
    } catch (error: any) {
      logger.error('Error polling session updates', { sessionId, error: error.message });
    }
  }, 5000); // Changed from 2000ms to 5000ms

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    clearInterval(pollInterval);
    logger.info('SSE connection closed', { sessionId });
  });
});

// Send message/answer in conversational Q&A flow
router.post('/:id/ask', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;
    // Accept both 'message' and 'question' for backwards compatibility
    const { message, question } = req.body;
    const content = message || question;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'message or question is required'
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

    logger.info('Processing answer in conversation', { sessionId, content: content.substring(0, 50) });

    // Check if we have questions in the new QuestionQueue
    const hasQueuedQuestions = await prisma.questionQueue.count({
      where: { sessionId }
    });

    if (hasQueuedQuestions > 0) {
      // Use the new ConversationAgent flow
      const result = await conversationAgent.processAnswer(sessionId, content);

      res.json({
        success: true,
        message: 'Answer processed',
        nextQuestion: result.nextQuestion,
        isFollowUp: result.isFollowUp,
        isComplete: result.isComplete,
        progress: result.progress,
        extractedInfo: result.extractedInfo,
        allComplete: result.isComplete,
        nextPhase: result.isComplete ? 'ready_for_poc' : 'answering'
      });
    } else {
      // Legacy flow: use old QuestionResponse table
      // Save user's message to conversation
      await prisma.message.create({
        data: {
          sessionId,
          role: 'user',
          content,
          timestamp: new Date()
        }
      });

      // Find and update the unanswered question
      const unansweredQuestion = await prisma.questionResponse.findFirst({
        where: { sessionId, answer: null },
        orderBy: { order: 'asc' }
      });

      if (unansweredQuestion) {
        await prisma.questionResponse.update({
          where: { id: unansweredQuestion.id },
          data: {
            answer: content,
            answeredAt: new Date()
          }
        });
        logger.info('Answer saved to legacy question', { sessionId, questionId: unansweredQuestion.id });
      }

      // Check if all questions are answered
      const totalQuestions = await prisma.questionResponse.count({
        where: { sessionId }
      });
      const answeredQuestions = await prisma.questionResponse.count({
        where: { sessionId, answer: { not: null } }
      });

      const allAnswered = totalQuestions > 0 && totalQuestions === answeredQuestions;

      res.json({
        success: true,
        message: 'Answer received (legacy flow)',
        nextQuestion: null, // Legacy flow doesn't return next question
        isFollowUp: false,
        isComplete: allAnswered,
        progress: {
          asked: answeredQuestions,
          total: totalQuestions
        },
        allComplete: allAnswered,
        nextPhase: allAnswered ? 'ready_for_poc' : 'answering'
      });
    }
  } catch (error: any) {
    logger.error('Failed to process message', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to process message'
    });
  }
});

// Generate follow-up questions
router.post('/:id/generate-followups', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    // Verify session exists
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
      include: {
        questionResponses: true,
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

    // TODO: Implement AI-based follow-up question generation
    // For now, return placeholder questions
    logger.info('Follow-up questions requested', { sessionId });

    const followupQuestions = [
      'What is the expected timeline for this implementation?',
      'Are there any specific performance requirements?',
      'What are the key success metrics for this solution?'
    ];

    res.json({
      success: true,
      questions: followupQuestions,
      count: followupQuestions.length
    });
  } catch (error: any) {
    logger.error('Failed to generate follow-up questions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to generate follow-up questions'
    });
  }
});

// Skip remaining questions and proceed to POC generation
router.post('/:id/skip-questions', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    logger.info('Skipping remaining questions', { sessionId });

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

    // Skip all pending questions in the queue
    const skippedCount = await prisma.questionQueue.updateMany({
      where: {
        sessionId,
        status: 'pending'
      },
      data: {
        status: 'skipped'
      }
    });

    // Update session status to questions_complete
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { status: 'questions_complete' }
    });

    logger.info('Questions skipped, ready for POC', {
      sessionId,
      skippedCount: skippedCount.count
    });

    res.json({
      success: true,
      message: `Skipped ${skippedCount.count} remaining questions. Ready for POC generation.`,
      skippedCount: skippedCount.count
    });
  } catch (error: any) {
    logger.error('Failed to skip questions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to skip questions'
    });
  }
});

// Delete a session
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = await prisma.analysisSession.findUnique({
      where: { id }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Session not found'
      });
    }

    await prisma.analysisSession.delete({
      where: { id }
    });

    logger.info('Session deleted', { sessionId: id });
    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete session', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete session'
    });
  }
});

export default router;
