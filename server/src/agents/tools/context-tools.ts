/**
 * Context Tools
 *
 * Tools for loading and processing context files and engineering task types.
 * Used by ConversationAgent to generate context-aware questions.
 *
 * Phase 2 Enhancements:
 * - Smart context detection from problem statement
 * - Selective section loading (reduced token usage)
 * - Context search and filtering by keywords
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../../config/logger';

const logger = createLogger();

// Path to context files directory
const CONTEXT_DIR = path.join(__dirname, '../../../../context');

// ============================================================================
// CONTEXT FILE METADATA
// ============================================================================

/**
 * Metadata for available context files
 */
export interface ContextFileMetadata {
  id: string;
  filename: string;
  name: string;
  description: string;
  defaultSections: string[];
}

/**
 * Available context files with metadata
 * Users manually select these in the UI
 */
export const AVAILABLE_CONTEXTS: ContextFileMetadata[] = [
  {
    id: 'context_engineering_iq',
    filename: 'context_engineering_iq.md',
    name: 'Engineering IQ',
    description: 'POC agent catalog for code analysis, testing, security, and development workflows',
    defaultSections: ['Quick Reference', 'Agent Categories', 'Available Agents']
  },
  {
    id: 'context_cognitive_iq',
    filename: 'context_cognitive_iq.md',
    name: 'CognitiveIQ',
    description: 'Knowledge graph and semantic analysis agents for AI reasoning',
    defaultSections: ['Overview', 'Available Agents', 'Configuration']
  },
  {
    id: 'context_gcp_repo_analyzer',
    filename: 'context_gcp_repo_analyzer.md',
    name: 'GCP Repo Analyzer',
    description: 'Google Cloud Platform repository analysis and caching tools',
    defaultSections: ['Overview', 'Available Tools', 'Usage Patterns']
  }
];

/**
 * Get list of available context files with metadata
 */
export function getAvailableContexts(): ContextFileMetadata[] {
  return AVAILABLE_CONTEXTS;
}

// ============================================================================
// SELECTIVE SECTION LOADING
// ============================================================================

/**
 * Load specific sections from a context file
 * More efficient than loading entire file (reduces tokens)
 */
export async function loadContextSections(
  contextId: string,
  sectionNames?: string[]
): Promise<string> {
  const context = AVAILABLE_CONTEXTS.find(c => c.id === contextId);
  if (!context) {
    logger.warn('Context not found', { contextId });
    return '';
  }

  try {
    const filePath = path.join(CONTEXT_DIR, context.filename);
    const content = await fs.readFile(filePath, 'utf-8');

    // If no specific sections requested, use default sections
    const sectionsToLoad = sectionNames && sectionNames.length > 0
      ? sectionNames
      : context.defaultSections;

    // Extract only requested sections
    const extractedSections: string[] = [];
    const allSections = content.split(/^##\s+/m);

    // Always include the header (first section with # title)
    const headerMatch = content.match(/^#\s+[^\n]+/);
    if (headerMatch) {
      extractedSections.push(headerMatch[0]);
    }

    for (const section of allSections) {
      if (!section.trim()) continue;

      const sectionTitle = section.split('\n')[0].trim().toLowerCase();

      for (const requested of sectionsToLoad) {
        if (sectionTitle.includes(requested.toLowerCase())) {
          extractedSections.push('## ' + section);
          break;
        }
      }
    }

    const result = extractedSections.join('\n\n');

    logger.info('Loaded context sections', {
      contextId,
      contextName: context.name,
      requestedSections: sectionsToLoad,
      loadedCount: extractedSections.length,
      originalSize: content.length,
      loadedSize: result.length,
      reduction: `${Math.round((1 - result.length / content.length) * 100)}%`
    });

    return result;
  } catch (error: any) {
    logger.error('Failed to load context sections', {
      contextId,
      error: error.message
    });
    return '';
  }
}

/**
 * Load context from manually selected context IDs
 * Users select contexts in the UI - no auto-detection
 */
export async function loadSelectedContexts(
  contextIds: string[]
): Promise<string> {
  if (!contextIds || contextIds.length === 0) {
    logger.info('No contexts selected');
    return '';
  }

  logger.info('Loading manually selected contexts', { contextIds });

  // Load sections from each context
  const contents: string[] = [];

  for (const contextId of contextIds) {
    const context = AVAILABLE_CONTEXTS.find(c => c.id === contextId);
    if (!context) continue;

    const sectionContent = await loadContextSections(contextId);
    if (sectionContent) {
      contents.push(`### Framework: ${context.name}\n\n${sectionContent}`);
    }
  }

  return contents.join('\n\n---\n\n');
}

// ============================================================================
// CONTEXT SEARCH
// ============================================================================

/**
 * Search result from context files
 */
export interface ContextSearchResult {
  contextId: string;
  contextName: string;
  section: string;
  content: string;
  score: number;
}

/**
 * Search context files for agents/tools matching keywords
 * Returns relevant sections from matching context files
 */
export async function searchContextsForAgents(
  keywords: string[],
  maxResults: number = 10
): Promise<ContextSearchResult[]> {
  const results: ContextSearchResult[] = [];

  for (const context of AVAILABLE_CONTEXTS) {
    try {
      const filePath = path.join(CONTEXT_DIR, context.filename);
      const content = await fs.readFile(filePath, 'utf-8');

      // Split into sections by ## headers
      const sections = content.split(/^##\s+/m).filter(s => s.trim());

      for (const section of sections) {
        const sectionTitle = section.split('\n')[0].trim();
        const sectionContent = section;

        // Score this section based on keyword matches
        let score = 0;
        const lowerContent = sectionContent.toLowerCase();

        for (const keyword of keywords) {
          const regex = new RegExp(keyword.toLowerCase(), 'gi');
          const matches = lowerContent.match(regex);
          if (matches) {
            score += matches.length;
          }
        }

        if (score > 0) {
          results.push({
            contextId: context.id,
            contextName: context.name,
            section: sectionTitle,
            content: sectionContent.substring(0, 2000), // Limit content size
            score
          });
        }
      }
    } catch (error: any) {
      logger.warn('Failed to search context file', {
        contextId: context.id,
        error: error.message
      });
    }
  }

  // Sort by score and limit results
  results.sort((a, b) => b.score - a.score);
  const topResults = results.slice(0, maxResults);

  logger.info('Context search completed', {
    keywords,
    totalMatches: results.length,
    returned: topResults.length
  });

  return topResults;
}

// ============================================================================
// ENGINEERING TASK TYPES (Existing functionality)
// ============================================================================

/**
 * Engineering task type definitions with question focus areas
 * IDs must match client/src/constants/engineeringTaskTypes.ts
 */
export const TASK_TYPE_PROMPTS: Record<string, string> = {
  'software_analysis': `
Focus on software codebase analysis questions:
- Programming languages and frameworks used
- Code architecture and patterns (monolith, microservices, etc.)
- Test coverage and testing strategies
- CI/CD pipelines and deployment processes
- Code quality tools and linting
- Documentation practices
- Dependency management and technical debt`,

  'test_strategy': `
Focus on test strategy development questions:
- Current test coverage and types (unit, integration, e2e)
- Testing frameworks in use or preferred
- CI/CD integration requirements
- Test data management approach
- Browser/device testing needs
- Performance testing requirements
- Test reporting and analytics
- Mocking and stubbing strategies`,

  'security_audit': `
Focus on security/compliance audit questions:
- Current security policies and compliance (SOC2, HIPAA, GDPR, PCI-DSS)
- Authentication and authorization mechanisms
- Data encryption (at rest, in transit)
- Vulnerability scanning practices
- Incident response procedures
- Access control and permissions
- Security monitoring and logging
- Third-party security assessments`,

  'feature_impact': `
Focus on feature impact analysis questions:
- Existing system architecture affected
- Performance implications of the new feature
- User experience considerations
- Database schema changes needed
- API contract changes
- Backwards compatibility requirements
- Rollout strategy (feature flags, gradual release)
- Monitoring and success metrics`,

  'requirement_clarification': `
Focus on requirement clarification questions:
- Ambiguous requirements that need specification
- Edge cases and boundary conditions
- User personas and use cases
- Acceptance criteria definition
- Non-functional requirements (performance, scalability)
- Dependencies on other systems or teams
- Timeline and priority constraints
- Success metrics and KPIs`,

  'custom_engineering': `
Focus on custom engineering task questions:
- Specific problem domain details
- Technical constraints and limitations
- Existing solutions or workarounds
- Integration requirements
- Performance expectations
- Maintenance and support considerations
- Documentation needs`,

  'general_ai': `
Focus on general AI solution questions:
- AI/ML use case and objectives
- Data availability and quality
- Model requirements (accuracy, latency, explainability)
- Integration with existing systems
- Training and deployment infrastructure
- Monitoring and model drift detection
- Ethical considerations and bias mitigation`,
};

/**
 * Get prompt guidance for selected engineering task types
 */
export function getTaskTypePrompts(taskTypes: string[]): string {
  if (!taskTypes || taskTypes.length === 0) {
    return '';
  }

  logger.info('Getting task type prompts', { taskTypes });

  const prompts: string[] = [];

  for (const taskType of taskTypes) {
    const prompt = TASK_TYPE_PROMPTS[taskType];
    if (prompt) {
      prompts.push(`## For ${taskType.replace(/-/g, ' ')}:${prompt}`);
    }
  }

  return prompts.join('\n\n');
}

// ============================================================================
// LEGACY FUNCTIONS (Maintained for backward compatibility)
// ============================================================================

/**
 * Load content from selected context files (LEGACY)
 * Use loadRelevantContext() or loadContextSections() for better performance
 */
export async function loadContextContents(contextIds: string[]): Promise<string> {
  if (!contextIds || contextIds.length === 0) {
    return '';
  }

  logger.info('Loading context files (legacy full load)', { contextIds });

  const contents: string[] = [];

  for (const contextId of contextIds) {
    try {
      // Add .md extension if not present
      const filename = contextId.endsWith('.md') ? contextId : `${contextId}.md`;
      const filePath = path.join(CONTEXT_DIR, filename);

      const content = await fs.readFile(filePath, 'utf-8');

      // Extract title for context header
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : contextId;

      contents.push(`### Context: ${title}\n\n${content}`);

      logger.info('Loaded context file', { contextId, title, size: content.length });
    } catch (error: any) {
      logger.warn('Failed to load context file', {
        contextId,
        error: error.message
      });
    }
  }

  return contents.join('\n\n---\n\n');
}

/**
 * Build complete context section for agent prompt (LEGACY)
 * Consider using loadRelevantContext() for auto-detection and optimization
 */
export async function buildContextPrompt(
  selectedContexts: string[],
  engineeringTaskTypes: string[]
): Promise<string> {
  const parts: string[] = [];

  // Add task type guidance
  const taskTypePrompt = getTaskTypePrompts(engineeringTaskTypes);
  if (taskTypePrompt) {
    parts.push('# Engineering Task Focus\n\n' + taskTypePrompt);
  }

  // Add context file contents
  const contextContent = await loadContextContents(selectedContexts);
  if (contextContent) {
    parts.push('# Domain Context Knowledge\n\n' + contextContent);
  }

  if (parts.length === 0) {
    return '';
  }

  return `
---
${parts.join('\n\n---\n\n')}
---

Use the context above to generate more targeted, relevant questions.
Focus your questions on the specific engineering task types and domain knowledge provided.
`;
}
