/**
 * SSE Events API Routes
 * Provides real-time updates via Server-Sent Events
 */

import { Router, Request, Response } from 'express';
import { sseManager } from '../../services/sse-manager';
import { createLogger } from '../../config/logger';

const router = Router();
const logger = createLogger();

/**
 * GET /api/events/sessions/:sessionId
 * Establish SSE connection for a session
 */
router.get('/sessions/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;

  logger.info('SSE connection requested', { sessionId });

  // Add the connection to the SSE manager
  sseManager.addConnection(sessionId, res);

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    if (sseManager.hasConnection(sessionId)) {
      sseManager.sendEvent(sessionId, {
        type: 'heartbeat',
        data: { timestamp: new Date().toISOString() },
      });
    } else {
      clearInterval(heartbeat);
    }
  }, 30000); // Every 30 seconds

  // Clean up on close
  res.on('close', () => {
    clearInterval(heartbeat);
  });
});

/**
 * GET /api/events/status
 * Get SSE connection status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    activeConnections: sseManager.getConnectionCount(),
    status: 'ok',
  });
});

/**
 * POST /api/events/sessions/:sessionId/send
 * Send a custom event to a session (for testing/admin)
 */
router.post('/sessions/:sessionId/send', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { type, data } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Event type is required' });
  }

  const success = sseManager.sendEvent(sessionId, { type, data: data || {} });

  if (success) {
    res.json({ success: true, message: 'Event sent' });
  } else {
    res.status(404).json({ error: 'No active connection for session' });
  }
});

export default router;
