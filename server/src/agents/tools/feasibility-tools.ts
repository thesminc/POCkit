/**
 * Automatic Feasibility Analysis Tools
 *
 * Phase 3 Enhancement #3: Analyzes requirements against context file capabilities
 * to determine if a POC is feasible.
 *
 * Feasibility Verdicts:
 * - YES: All requirements can be met with available tools
 * - PARTIAL: Some requirements can be met, gaps identified
 * - NO: Critical requirements cannot be met
 */

import { searchContextsForAgents, AVAILABLE_CONTEXTS } from './context-tools';
import { createLogger } from '../../config/logger';

const logger = createLogger();

/**
 * Requirement extracted from problem statement
 */
export interface Requirement {
  id: string;
  description: string;
  category: 'functional' | 'technical' | 'integration' | 'performance' | 'security';
  priority: 'critical' | 'high' | 'medium' | 'low';
  keywords: string[];
}

/**
 * Capability found in context files
 */
export interface Capability {
  contextId: string;
  contextName: string;
  capability: string;
  source: string;
  confidence: number;
}

/**
 * Gap between requirements and capabilities
 */
export interface Gap {
  requirement: Requirement;
  gapType: 'missing' | 'partial' | 'alternative';
  description: string;
  suggestion: string;
}

/**
 * Feasibility analysis result
 */
export interface FeasibilityResult {
  verdict: 'YES' | 'PARTIAL' | 'NO';
  score: number; // 0-100
  summary: string;
  requirements: Requirement[];
  matchedCapabilities: {
    requirement: Requirement;
    capabilities: Capability[];
    coverage: number; // 0-100
  }[];
  gaps: Gap[];
  recommendations: string[];
}

/**
 * Keywords for extracting requirements from problem statement
 */
const REQUIREMENT_PATTERNS = {
  functional: [
    /need[s]?\s+to\s+(.+?)(?:\.|,|$)/gi,
    /should\s+(.+?)(?:\.|,|$)/gi,
    /must\s+(.+?)(?:\.|,|$)/gi,
    /require[s]?\s+(.+?)(?:\.|,|$)/gi,
    /want[s]?\s+to\s+(.+?)(?:\.|,|$)/gi,
  ],
  technical: [
    /using\s+(.+?)(?:\.|,|$)/gi,
    /integrate[s]?\s+with\s+(.+?)(?:\.|,|$)/gi,
    /connect[s]?\s+to\s+(.+?)(?:\.|,|$)/gi,
    /support[s]?\s+(.+?)(?:\.|,|$)/gi,
  ],
  integration: [
    /integrat(?:e|ion)\s+(?:with\s+)?(.+?)(?:\.|,|$)/gi,
    /connect(?:ion)?\s+(?:to|with)\s+(.+?)(?:\.|,|$)/gi,
    /api\s+(?:to|for|with)\s+(.+?)(?:\.|,|$)/gi,
  ],
  performance: [
    /fast(?:er)?\s+(.+?)(?:\.|,|$)/gi,
    /performance\s+(.+?)(?:\.|,|$)/gi,
    /scalab(?:le|ility)\s+(.+?)(?:\.|,|$)/gi,
    /handle\s+(\d+\s*\w+)/gi,
  ],
  security: [
    /secur(?:e|ity)\s+(.+?)(?:\.|,|$)/gi,
    /encrypt(?:ion)?\s+(.+?)(?:\.|,|$)/gi,
    /authenticat(?:e|ion)\s+(.+?)(?:\.|,|$)/gi,
    /complian(?:t|ce)\s+(.+?)(?:\.|,|$)/gi,
  ],
};

/**
 * Priority keywords
 */
const PRIORITY_KEYWORDS = {
  critical: ['critical', 'must', 'essential', 'mandatory', 'required', 'blocker'],
  high: ['important', 'significant', 'key', 'main', 'primary'],
  medium: ['should', 'want', 'prefer', 'nice to have'],
  low: ['optional', 'if possible', 'consider', 'future'],
};

/**
 * Analyze feasibility of a POC based on requirements vs capabilities
 */
export async function analyzeFeasibility(
  problemStatement: string,
  techStack: string[] = [],
  selectedContexts: string[] = []
): Promise<FeasibilityResult> {
  logger.info('Starting feasibility analysis', {
    problemStatementLength: problemStatement.length,
    techStackCount: techStack.length,
    selectedContextsCount: selectedContexts.length,
  });

  // Extract requirements from problem statement
  const requirements = extractRequirements(problemStatement);

  logger.info('Extracted requirements', { count: requirements.length });

  // Find capabilities in context files
  const matchedCapabilities: FeasibilityResult['matchedCapabilities'] = [];
  const gaps: Gap[] = [];

  for (const req of requirements) {
    const capabilities = await findCapabilities(req, selectedContexts);

    const coverage = calculateCoverage(req, capabilities);

    matchedCapabilities.push({
      requirement: req,
      capabilities,
      coverage,
    });

    // Identify gaps
    if (coverage < 50) {
      gaps.push({
        requirement: req,
        gapType: coverage === 0 ? 'missing' : 'partial',
        description: `No tools found to fully address: "${req.description}"`,
        suggestion: generateGapSuggestion(req),
      });
    }
  }

  // Calculate overall score and verdict
  const score = calculateOverallScore(matchedCapabilities);
  const verdict = determineVerdict(score, gaps, requirements);
  const summary = generateSummary(verdict, score, requirements.length, gaps.length);
  const recommendations = generateRecommendations(gaps, matchedCapabilities);

  const result: FeasibilityResult = {
    verdict,
    score,
    summary,
    requirements,
    matchedCapabilities,
    gaps,
    recommendations,
  };

  logger.info('Feasibility analysis completed', {
    verdict,
    score,
    requirementsCount: requirements.length,
    gapsCount: gaps.length,
  });

  return result;
}

/**
 * Extract requirements from problem statement
 */
function extractRequirements(problemStatement: string): Requirement[] {
  const requirements: Requirement[] = [];
  let id = 1;

  for (const [category, patterns] of Object.entries(REQUIREMENT_PATTERNS)) {
    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(problemStatement)) !== null) {
        const description = match[1]?.trim();

        if (description && description.length > 5 && description.length < 200) {
          // Determine priority
          const priority = determinePriority(description, problemStatement);

          // Extract keywords
          const keywords = description
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3);

          requirements.push({
            id: `REQ-${id++}`,
            description,
            category: category as Requirement['category'],
            priority,
            keywords,
          });
        }
      }
    }
  }

  // Deduplicate similar requirements
  return deduplicateRequirements(requirements);
}

/**
 * Determine priority based on keywords
 */
function determinePriority(description: string, context: string): Requirement['priority'] {
  const text = (description + ' ' + context).toLowerCase();

  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return priority as Requirement['priority'];
      }
    }
  }

  return 'medium';
}

/**
 * Deduplicate similar requirements
 */
function deduplicateRequirements(requirements: Requirement[]): Requirement[] {
  const unique: Requirement[] = [];

  for (const req of requirements) {
    const isDuplicate = unique.some(u =>
      u.description.toLowerCase() === req.description.toLowerCase() ||
      (u.keywords.length > 0 && req.keywords.length > 0 &&
        u.keywords.filter(k => req.keywords.includes(k)).length >= Math.min(u.keywords.length, req.keywords.length) * 0.7)
    );

    if (!isDuplicate) {
      unique.push(req);
    }
  }

  return unique;
}

/**
 * Find capabilities in context files that match a requirement
 */
async function findCapabilities(
  requirement: Requirement,
  selectedContexts: string[]
): Promise<Capability[]> {
  const searchResults = await searchContextsForAgents(requirement.keywords, 5);

  const capabilities: Capability[] = [];

  for (const result of searchResults) {
    // Filter by selected contexts if specified
    if (selectedContexts.length > 0 && !selectedContexts.includes(result.contextId)) {
      continue;
    }

    capabilities.push({
      contextId: result.contextId,
      contextName: result.contextName,
      capability: result.section,
      source: result.content.substring(0, 200),
      confidence: Math.min(result.score * 10, 100),
    });
  }

  return capabilities;
}

/**
 * Calculate how well capabilities cover a requirement
 */
function calculateCoverage(requirement: Requirement, capabilities: Capability[]): number {
  if (capabilities.length === 0) return 0;

  // Higher coverage for more capabilities and higher confidence
  const avgConfidence = capabilities.reduce((sum, c) => sum + c.confidence, 0) / capabilities.length;
  const countBonus = Math.min(capabilities.length * 10, 30);

  return Math.min(avgConfidence + countBonus, 100);
}

/**
 * Calculate overall feasibility score
 */
function calculateOverallScore(
  matchedCapabilities: FeasibilityResult['matchedCapabilities']
): number {
  if (matchedCapabilities.length === 0) return 0;

  // Weight by priority
  const weights = {
    critical: 3,
    high: 2,
    medium: 1,
    low: 0.5,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const match of matchedCapabilities) {
    const weight = weights[match.requirement.priority];
    weightedSum += match.coverage * weight;
    totalWeight += weight;
  }

  return Math.round(weightedSum / totalWeight);
}

/**
 * Determine feasibility verdict
 */
function determineVerdict(
  score: number,
  gaps: Gap[],
  requirements: Requirement[]
): FeasibilityResult['verdict'] {
  // Check for critical gaps
  const criticalGaps = gaps.filter(g =>
    g.requirement.priority === 'critical' && g.gapType === 'missing'
  );

  if (criticalGaps.length > 0) {
    return 'NO';
  }

  if (score >= 70 && gaps.length === 0) {
    return 'YES';
  }

  if (score >= 50 || gaps.filter(g => g.gapType === 'missing').length < requirements.length / 2) {
    return 'PARTIAL';
  }

  return 'NO';
}

/**
 * Generate summary text
 */
function generateSummary(
  verdict: FeasibilityResult['verdict'],
  score: number,
  reqCount: number,
  gapCount: number
): string {
  if (verdict === 'YES') {
    return `Feasibility Score: ${score}/100. All ${reqCount} identified requirements can be addressed with available tools and frameworks.`;
  }

  if (verdict === 'PARTIAL') {
    return `Feasibility Score: ${score}/100. ${reqCount - gapCount} of ${reqCount} requirements can be fully addressed. ${gapCount} gap(s) identified that may require additional tools or custom development.`;
  }

  return `Feasibility Score: ${score}/100. Significant gaps identified. ${gapCount} critical requirements cannot be met with available tools. Consider alternative approaches or custom development.`;
}

/**
 * Generate suggestion for a gap
 */
function generateGapSuggestion(requirement: Requirement): string {
  switch (requirement.category) {
    case 'functional':
      return 'Consider custom development or evaluate third-party solutions';
    case 'technical':
      return 'Review alternative technologies or frameworks that provide this capability';
    case 'integration':
      return 'Look for middleware or iPaaS solutions that support this integration';
    case 'performance':
      return 'Consider architecture optimizations or specialized performance tools';
    case 'security':
      return 'Evaluate security-focused tools or consult with security specialists';
    default:
      return 'Research alternative solutions or consider custom implementation';
  }
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  gaps: Gap[],
  matchedCapabilities: FeasibilityResult['matchedCapabilities']
): string[] {
  const recommendations: string[] = [];

  // Recommend based on gaps
  if (gaps.length > 0) {
    recommendations.push(`Address ${gaps.length} identified gap(s) before proceeding with full implementation`);

    const missingCount = gaps.filter(g => g.gapType === 'missing').length;
    if (missingCount > 0) {
      recommendations.push(`${missingCount} requirement(s) need custom solutions or alternative tools`);
    }
  }

  // Recommend high-coverage tools
  const highCoverage = matchedCapabilities.filter(m => m.coverage >= 80);
  if (highCoverage.length > 0) {
    const tools = [...new Set(highCoverage.flatMap(m => m.capabilities.map(c => c.contextName)))];
    recommendations.push(`Prioritize tools from: ${tools.join(', ')}`);
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Proceed with POC using available tools');
    recommendations.push('Monitor progress and adjust approach as needed');
  }

  return recommendations;
}

/**
 * Quick feasibility check (simpler, faster)
 */
export async function quickFeasibilityCheck(
  problemStatement: string
): Promise<{ verdict: FeasibilityResult['verdict']; score: number; summary: string }> {
  const result = await analyzeFeasibility(problemStatement);

  return {
    verdict: result.verdict,
    score: result.score,
    summary: result.summary,
  };
}
