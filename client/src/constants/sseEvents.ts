/**
 * Server-Sent Events (SSE) event type constants
 * Used for real-time communication between server and client
 */

export const SSE_EVENTS = {
  CONNECTED: "connected",
  AGENTS_READY: "agents_ready",
  QUESTIONS_READY: "questions_ready",
  POC_READY: "poc_ready",
} as const;

export type SSEEventType = typeof SSE_EVENTS[keyof typeof SSE_EVENTS];

/**
 * Interface for SSE event data payloads
 */
export interface SSEEventData {
  [SSE_EVENTS.CONNECTED]: {
    message: string;
  };
  [SSE_EVENTS.AGENTS_READY]: {
    phase: string;
    agentCount?: number;
  };
  [SSE_EVENTS.QUESTIONS_READY]: {
    questionCount: number;
  };
  [SSE_EVENTS.POC_READY]: {
    pocId: string;
    format: string;
  };
}
