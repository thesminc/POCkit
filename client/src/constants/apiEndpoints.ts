/**
 * API endpoint constants
 * Centralized API routes for the application
 */

export const API_ENDPOINTS = {
  // Projects
  PROJECTS: '/api/projects',
  PROJECT_BY_ID: (id: string) => `/api/projects/${id}`,
  PROJECT_BRANCHES: (projectId: string) => `/api/projects/${projectId}/branches`,

  // Sessions
  SESSIONS: '/api/sessions',
  SESSION_BY_ID: (sessionId: string) => `/api/sessions/${sessionId}`,
  SESSION_MESSAGES: (sessionId: string) => `/api/sessions/${sessionId}/messages`,
  SESSION_ASK: (sessionId: string) => `/api/sessions/${sessionId}/ask`,
  SESSION_ANALYZE: (sessionId: string) => `/api/sessions/${sessionId}/analyze`,
  SESSION_PROBLEM_STATEMENT: (sessionId: string) => `/api/sessions/${sessionId}/problem-statement`,
  SESSION_GENERATE_POC: (sessionId: string) => `/api/sessions/${sessionId}/generate-poc`,
  SESSION_POCS: (sessionId: string) => `/api/sessions/${sessionId}/pocs`,
  SESSION_EVENTS: (sessionId: string) => `/api/sessions/${sessionId}/events`,

  // Branches
  BRANCH_BY_ID: (branchId: string) => `/api/branches/${branchId}`,
  BRANCH_POCS: (branchId: string) => `/api/branches/${branchId}/pocs`,
  BRANCH_GENERATE_POC: (branchId: string) => `/api/branches/${branchId}/generate-poc`,
  BRANCH_COMPARISON: (projectId: string, sourceBranch: string, targetBranch: string) =>
    `/api/projects/${projectId}/compare/${sourceBranch}/${targetBranch}`,

  // POCs
  POC_BY_ID: (pocId: string) => `/api/pocs/${pocId}`,
  POC_DOWNLOAD: (pocId: string) => `/api/pocs/${pocId}/download`,
  POC_EXPORT: (pocId: string) => `/api/pocs/${pocId}/export`,

  // Contexts
  CONTEXTS: '/api/contexts',

  // Agent-based endpoints (NEW)
  AGENT_ANALYZE: (sessionId: string) => `/api/agents/sessions/${sessionId}/analyze`,
  AGENT_QUESTIONS: (sessionId: string) => `/api/agents/sessions/${sessionId}/questions`,
  AGENT_NEXT_QUESTION: (sessionId: string) => `/api/agents/sessions/${sessionId}/next-question`,
  AGENT_ANSWER: (sessionId: string) => `/api/agents/sessions/${sessionId}/answer`,
  AGENT_GENERATE_POC: (sessionId: string) => `/api/agents/sessions/${sessionId}/generate-poc`,
  AGENT_STATUS: (sessionId: string) => `/api/agents/sessions/${sessionId}/status`,
  AGENT_COMPLETE_FLOW: (sessionId: string) => `/api/agents/sessions/${sessionId}/execute-complete-flow`,
} as const;
