/**
 * Central export for all agent tools
 */

export {
  saveAnalysisResult,
  saveAISolution,
  getSessionData,
  logAgentExecution,
  saveQuestionResponse,
  updateQuestionAnswer,
  saveGeneratedPoc,
  type ToolResult,
} from './database-tools';

export {
  getAllFileContents,
  extractTextFromDOCX,
  extractTextFromPDF,
  extractTextFromTXT,
  readFileWithAutoDetect,
} from './file-tools';

export {
  validateJsonSchema,
  checkCitationFormat,
  validateConfidenceScore,
  validationTools,
} from './validation-tools';

// Phase 2: Context Tools (Manual Selection)
export {
  loadContextSections,
  loadSelectedContexts,
  searchContextsForAgents,
  getAvailableContexts,
  loadContextContents,
  buildContextPrompt,
  getTaskTypePrompts,
  AVAILABLE_CONTEXTS,
  TASK_TYPE_PROMPTS,
  type ContextFileMetadata,
  type ContextSearchResult,
} from './context-tools';

// Phase 3: Tech Stack Recommendation Engine
export {
  recommendTools,
  getQuickRecommendations,
  type TechStackItem,
  type ToolRecommendation,
} from './recommendation-tools';

// Phase 3: Automatic Feasibility Analysis
export {
  analyzeFeasibility,
  quickFeasibilityCheck,
  type Requirement,
  type Capability,
  type Gap,
  type FeasibilityResult,
} from './feasibility-tools';
