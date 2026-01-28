/**
 * Shared types for agent architecture
 */

// Base agent configuration
export interface AgentConfig {
  name: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// File Analysis Agent Types
export interface ExtractedInfo {
  info: string;
  source: string;
  location: string;
  confidence: 'high' | 'medium' | 'low';
  quote?: string;
}

export interface AISolution {
  name: string;
  vendor: string;
  category: string;
  url?: string;
  capabilities: string[];
  aiFeatures: {
    machineLearning?: boolean;
    naturalLanguageProcessing?: boolean;
    computerVision?: boolean;
    generativeAI?: boolean;
    processAutomation?: boolean;
  };
  migrationComplexity: 'low' | 'medium' | 'high';
  costEstimate?: string;
  industryAdoption?: string;
  complianceSupport?: string[];
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

export interface SolutionRecommendation {
  solution: string;
  reasoning: string;
  score: number;
  pros: string[];
  cons: string[];
  migrationPath?: string;
}

export interface FileAnalysisOutput {
  problemStatementAnalysis: {
    sourceTechnologies: string[];
    targetConstraint: {
      specified: boolean;
      platform?: string;
      reasoning: string;
    };
    businessRequirements: string[];
    complianceNeeds: string[];
    constraints: string[];
  };
  discoveredAISolutions: AISolution[];
  recommendations: {
    topChoice: SolutionRecommendation;
    alternatives: SolutionRecommendation[];
  };
  techStack: {
    current: ExtractedInfo[];
    target: ExtractedInfo[];
  };
  architecture: ExtractedInfo[];
  data: ExtractedInfo[];
  infrastructure: ExtractedInfo[];
  unknowns: string[];
}

// Question Generation Agent Types
export interface GeneratedQuestion {
  id: string;
  question: string;
  category: 'essential' | 'technical' | 'migration-specific' | 'ai-solution' | 'clarification';
  reasoning: string;
  canSkip: boolean;
}

export interface QuestionGenerationOutput {
  questions: GeneratedQuestion[];
  totalGenerated: number;
  filtered: number;
}

// Conversation Orchestrator Agent Types
export interface ConversationState {
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: number;
  skippedQuestions: number;
  isComplete: boolean;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// POC Generation Agent Types
export interface FrameworkInfo {
  id: string;
  name: string;
  version: string;
  agentCount: number;
  categories: string[];
}

export interface AgentRecommendation {
  frameworkId: string;
  frameworkName: string;
  agentId: string;
  agentName: string;
  category: string;
  purpose: string;
  relevanceScore: number;
  reasoning: string;
  integrationMethod: 'PythonAPI' | 'MCP' | 'CLI' | 'HTTP';
  estimatedTime?: string;
  documentation?: string;
}

export interface POCGenerationOutput {
  content: string; // Markdown content
  includedSections: string[];
  aiSolutions: string[];
  recommendedTools: AgentRecommendation[];
  citations: number;
  wordCount: number;
  pocId?: string; // POC database ID (returned after save)
}

// Agent Execution Types
export interface AgentExecutionContext {
  sessionId: string;
  agentType: 'file_analysis' | 'question_generation' | 'conversation_orchestrator' | 'poc_generation';
  startTime: Date;
  inputData?: any;
}

export interface AgentExecutionResult {
  success: boolean;
  outputData?: any;
  error?: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
    cached?: number;
  };
  durationMs: number;
}

// Tool result types
export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Web search types
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface WebSearchResult {
  query: string;
  results: SearchResult[];
  totalResults: number;
}
