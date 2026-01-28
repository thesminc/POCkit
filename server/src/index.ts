import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createLogger } from './config/logger';
import pocRoutes from './api/routes/poc';
import projectRoutes from './api/routes/projects';
import branchRoutes from './api/routes/branches';
import sessionRoutes from './api/routes/sessions';
import analysisRoutes from './api/routes/analysis';
import conversationRoutes from './api/routes/conversation';
import agentRoutes from './api/routes/agents';
import contextRoutes from './api/routes/contexts';
import pocsRoutes from './api/routes/pocs';
import eventsRoutes from './api/routes/events';
import exportRoutes from './api/routes/export';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const logger = createLogger();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'AICT POC Generation API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/poc', pocRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/contexts', contextRoutes);
app.use('/api/pocs', pocsRoutes);
app.use('/api/events', eventsRoutes);  // SSE real-time events
app.use('/api/export', exportRoutes);  // POC export (PDF, PPTX, MD)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });
  res.status(500).json({
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong',
  });
});

// Start server
app.listen(port, () => {
  logger.info(`Server started on port ${port}`, {
    port,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
  });
});

export default app;
