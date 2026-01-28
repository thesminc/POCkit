/**
 * SSE Manager - Server-Sent Events for real-time updates
 * Migrated from AICT
 *
 * Usage:
 * - Client connects to /api/sessions/:sessionId/events
 * - Server stores the connection
 * - When async work completes, server sends event via sendEvent()
 * - Client receives event and acts accordingly (e.g., reload messages)
 */

import { Response } from 'express';
import { createLogger } from '../config/logger';

const logger = createLogger();

export interface SSEEvent {
  type: string;
  data: any;
}

export class SSEManager {
  // Map of sessionId -> Response object
  private connections: Map<string, Response> = new Map();

  /**
   * Register a new SSE connection for a session
   */
  addConnection(sessionId: string, res: Response): void {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Store connection
    this.connections.set(sessionId, res);

    logger.info('SSE connection established', { sessionId });

    // Send initial connection confirmation
    this.sendEvent(sessionId, {
      type: 'connected',
      data: { message: 'SSE connection established' },
    });

    // Handle client disconnect
    res.on('close', () => {
      this.removeConnection(sessionId);
      logger.info('SSE connection closed', { sessionId });
    });
  }

  /**
   * Send an event to a specific session
   */
  sendEvent(sessionId: string, event: SSEEvent): boolean {
    const res = this.connections.get(sessionId);

    if (!res) {
      logger.warn('No SSE connection found for session', { sessionId });
      return false;
    }

    try {
      // SSE format: event: <type>\ndata: <json>\n\n
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event.data)}\n\n`);

      logger.debug('SSE event sent', {
        sessionId,
        eventType: event.type,
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to send SSE event', {
        sessionId,
        error: error.message,
      });
      this.removeConnection(sessionId);
      return false;
    }
  }

  /**
   * Send progress update (convenience method)
   */
  sendProgress(sessionId: string, step: number, total: number, message: string): boolean {
    return this.sendEvent(sessionId, {
      type: 'progress',
      data: { step, total, message, percentage: Math.round((step / total) * 100) },
    });
  }

  /**
   * Send completion event (convenience method)
   */
  sendComplete(sessionId: string, data: any): boolean {
    return this.sendEvent(sessionId, {
      type: 'complete',
      data,
    });
  }

  /**
   * Send error event (convenience method)
   */
  sendError(sessionId: string, error: string): boolean {
    return this.sendEvent(sessionId, {
      type: 'error',
      data: { error },
    });
  }

  /**
   * Remove a connection (client disconnected or error)
   */
  removeConnection(sessionId: string): void {
    const res = this.connections.get(sessionId);
    if (res) {
      try {
        res.end();
      } catch (error) {
        // Already closed, ignore
      }
      this.connections.delete(sessionId);
    }
  }

  /**
   * Broadcast event to all connected sessions (rarely used)
   */
  broadcast(event: SSEEvent): void {
    logger.info('Broadcasting SSE event to all sessions', {
      eventType: event.type,
      connectionCount: this.connections.size,
    });

    for (const [sessionId] of this.connections) {
      this.sendEvent(sessionId, event);
    }
  }

  /**
   * Get number of active connections
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Check if a session has an active SSE connection
   */
  hasConnection(sessionId: string): boolean {
    return this.connections.has(sessionId);
  }
}

// Export singleton instance
export const sseManager = new SSEManager();
