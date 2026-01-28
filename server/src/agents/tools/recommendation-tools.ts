/**
 * Tech Stack Recommendation Tools
 *
 * Phase 3 Enhancement #2: Recommends tools from context files based on
 * the current tech stack discovered during file analysis.
 *
 * Scoring Weights:
 * - Technical Fit: 30%
 * - Migration Complexity (inverse): 25%
 * - AI/ML Capabilities: 25%
 * - Cost Efficiency: 10%
 * - Ecosystem Maturity: 10%
 */

import { searchContextsForAgents, AVAILABLE_CONTEXTS, loadContextSections } from './context-tools';
import { createLogger } from '../../config/logger';

const logger = createLogger();

/**
 * Tech stack item discovered from file analysis
 */
export interface TechStackItem {
  name: string;
  category: string; // 'language', 'framework', 'database', 'integration', 'cloud', etc.
  version?: string;
  source?: string;
}

/**
 * Tool recommendation with scoring
 */
export interface ToolRecommendation {
  contextId: string;
  contextName: string;
  toolName: string;
  toolId: string;
  section: string;
  purpose: string;
  score: number;
  scores: {
    technicalFit: number;
    migrationComplexity: number;
    aiCapabilities: number;
    costEfficiency: number;
    ecosystemMaturity: number;
  };
  reasoning: string;
  useCase: string;
}

/**
 * Scoring weights for recommendations
 */
const WEIGHTS = {
  technicalFit: 0.30,
  migrationComplexity: 0.25,
  aiCapabilities: 0.25,
  costEfficiency: 0.10,
  ecosystemMaturity: 0.10,
};

/**
 * Keywords that indicate AI/ML capabilities
 */
const AI_KEYWORDS = [
  'ai', 'ml', 'machine learning', 'deep learning', 'neural',
  'nlp', 'natural language', 'cognitive', 'intelligent',
  'prediction', 'classification', 'embedding', 'vector',
  'llm', 'gpt', 'claude', 'transformer', 'model'
];

/**
 * Keywords that indicate high migration complexity
 */
const COMPLEXITY_KEYWORDS = [
  'legacy', 'migration', 'refactor', 'rewrite', 'overhaul',
  'deprecated', 'obsolete', 'mainframe', 'cobol',
  'monolith', 'tightly coupled', 'spaghetti'
];

/**
 * Generate tech stack recommendations from context files
 */
export async function recommendTools(
  techStack: TechStackItem[],
  problemStatement: string,
  maxRecommendations: number = 10
): Promise<ToolRecommendation[]> {
  logger.info('Starting tech stack recommendation', {
    techStackCount: techStack.length,
    problemStatementLength: problemStatement.length,
  });

  // Extract keywords from tech stack and problem statement
  const keywords = extractKeywords(techStack, problemStatement);

  logger.info('Extracted keywords for search', { keywords });

  // Search context files for matching tools
  const searchResults = await searchContextsForAgents(keywords, 20);

  if (searchResults.length === 0) {
    logger.info('No matching tools found in context files');
    return [];
  }

  // Score each result
  const recommendations: ToolRecommendation[] = [];

  for (const result of searchResults) {
    const scores = calculateScores(result, techStack, problemStatement, keywords);
    const totalScore = calculateTotalScore(scores);

    // Extract tool name and ID from section content
    const toolInfo = extractToolInfo(result.section, result.content);

    const recommendation: ToolRecommendation = {
      contextId: result.contextId,
      contextName: result.contextName,
      toolName: toolInfo.name,
      toolId: toolInfo.id,
      section: result.section,
      purpose: toolInfo.purpose,
      score: totalScore,
      scores,
      reasoning: generateReasoning(scores, techStack),
      useCase: generateUseCase(result.section, techStack, problemStatement),
    };

    recommendations.push(recommendation);
  }

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);

  // Return top N
  const topRecommendations = recommendations.slice(0, maxRecommendations);

  logger.info('Tech stack recommendations generated', {
    totalFound: recommendations.length,
    returned: topRecommendations.length,
    topScore: topRecommendations[0]?.score || 0,
  });

  return topRecommendations;
}

/**
 * Extract search keywords from tech stack and problem statement
 */
function extractKeywords(techStack: TechStackItem[], problemStatement: string): string[] {
  const keywords: Set<string> = new Set();

  // Add tech stack names and categories
  for (const item of techStack) {
    keywords.add(item.name.toLowerCase());
    keywords.add(item.category.toLowerCase());
  }

  // Extract important words from problem statement
  const problemWords = problemStatement
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !['that', 'this', 'with', 'from', 'have', 'been', 'were', 'will', 'would', 'could', 'should'].includes(w));

  for (const word of problemWords) {
    keywords.add(word);
  }

  // Add common POC-related keywords
  keywords.add('analysis');
  keywords.add('migration');
  keywords.add('integration');

  return Array.from(keywords).slice(0, 20); // Limit to 20 keywords
}

/**
 * Calculate individual scores for a search result
 */
function calculateScores(
  result: { contextId: string; section: string; content: string; score: number },
  techStack: TechStackItem[],
  problemStatement: string,
  keywords: string[]
): ToolRecommendation['scores'] {
  const content = result.content.toLowerCase();
  const section = result.section.toLowerCase();

  // Technical Fit (0-100): How well does this tool match the tech stack?
  let technicalFit = 0;
  for (const item of techStack) {
    if (content.includes(item.name.toLowerCase())) {
      technicalFit += 20;
    }
    if (content.includes(item.category.toLowerCase())) {
      technicalFit += 10;
    }
  }
  technicalFit = Math.min(technicalFit, 100);

  // Migration Complexity (0-100, inverse): Lower complexity = higher score
  let complexityCount = 0;
  for (const keyword of COMPLEXITY_KEYWORDS) {
    if (problemStatement.toLowerCase().includes(keyword)) {
      complexityCount++;
    }
  }
  // If problem mentions complexity, prefer simpler tools
  const migrationComplexity = complexityCount > 0
    ? (content.includes('simple') || content.includes('easy') ? 80 : 50)
    : 70;

  // AI Capabilities (0-100): Does this tool have AI/ML features?
  let aiCapabilities = 0;
  for (const keyword of AI_KEYWORDS) {
    if (content.includes(keyword)) {
      aiCapabilities += 15;
    }
  }
  aiCapabilities = Math.min(aiCapabilities, 100);

  // Cost Efficiency (0-100): Prefer open source and free tools
  let costEfficiency = 50;
  if (content.includes('open source') || content.includes('free')) {
    costEfficiency = 90;
  } else if (content.includes('enterprise') || content.includes('paid')) {
    costEfficiency = 40;
  }

  // Ecosystem Maturity (0-100): Based on context file type
  let ecosystemMaturity = 70;
  if (result.contextId === 'context_engineering_iq') {
    ecosystemMaturity = 85; // Engineering IQ is well-established
  } else if (result.contextId.startsWith('context_user_')) {
    ecosystemMaturity = 60; // User-generated contexts are newer
  }

  return {
    technicalFit,
    migrationComplexity,
    aiCapabilities,
    costEfficiency,
    ecosystemMaturity,
  };
}

/**
 * Calculate total weighted score
 */
function calculateTotalScore(scores: ToolRecommendation['scores']): number {
  return Math.round(
    scores.technicalFit * WEIGHTS.technicalFit +
    scores.migrationComplexity * WEIGHTS.migrationComplexity +
    scores.aiCapabilities * WEIGHTS.aiCapabilities +
    scores.costEfficiency * WEIGHTS.costEfficiency +
    scores.ecosystemMaturity * WEIGHTS.ecosystemMaturity
  );
}

/**
 * Extract tool name and ID from section content
 */
function extractToolInfo(section: string, content: string): { name: string; id: string; purpose: string } {
  // Try to extract tool name from section header
  const name = section.replace(/^\d+\.\s*/, '').trim();

  // Try to extract ID from content
  const idMatch = content.match(/\*\*(?:Agent |Tool )?ID\*\*:\s*`([^`]+)`/i);
  const id = idMatch ? idMatch[1] : name.toLowerCase().replace(/\s+/g, '_');

  // Try to extract purpose
  const purposeMatch = content.match(/\*\*Purpose\*\*:\s*(.+?)(?:\n|$)/i);
  const purpose = purposeMatch ? purposeMatch[1].trim() : `Tool for ${name}`;

  return { name, id, purpose };
}

/**
 * Generate reasoning text for a recommendation
 */
function generateReasoning(
  scores: ToolRecommendation['scores'],
  techStack: TechStackItem[]
): string {
  const reasons: string[] = [];

  if (scores.technicalFit >= 60) {
    reasons.push('Strong match with your tech stack');
  }
  if (scores.aiCapabilities >= 50) {
    reasons.push('Provides AI/ML capabilities');
  }
  if (scores.migrationComplexity >= 70) {
    reasons.push('Low migration complexity');
  }
  if (scores.costEfficiency >= 70) {
    reasons.push('Cost-effective solution');
  }
  if (scores.ecosystemMaturity >= 80) {
    reasons.push('Mature and well-documented');
  }

  return reasons.length > 0
    ? reasons.join('. ') + '.'
    : 'Potentially useful for your POC.';
}

/**
 * Generate use case description
 */
function generateUseCase(
  section: string,
  techStack: TechStackItem[],
  problemStatement: string
): string {
  const sectionLower = section.toLowerCase();

  if (sectionLower.includes('analyzer') || sectionLower.includes('analysis')) {
    return 'Use during the analysis phase to understand your current architecture';
  }
  if (sectionLower.includes('migration') || sectionLower.includes('converter')) {
    return 'Use for migrating or converting existing code/data';
  }
  if (sectionLower.includes('test') || sectionLower.includes('qa')) {
    return 'Use to validate and test your migration';
  }
  if (sectionLower.includes('generator') || sectionLower.includes('report')) {
    return 'Use to generate documentation and reports';
  }
  if (sectionLower.includes('helper') || sectionLower.includes('utility')) {
    return 'Use as a supporting tool during POC development';
  }

  return 'Use as part of your POC implementation';
}

/**
 * Get quick recommendations based on problem statement only
 * (faster, no tech stack required)
 */
export async function getQuickRecommendations(
  problemStatement: string,
  maxResults: number = 5
): Promise<ToolRecommendation[]> {
  // Extract keywords from problem statement
  const keywords = problemStatement
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4)
    .slice(0, 10);

  return recommendTools([], problemStatement, maxResults);
}
