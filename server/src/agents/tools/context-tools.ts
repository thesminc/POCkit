/**
 * Context Tools
 *
 * Tools for loading and processing context files and engineering task types.
 * Used by ConversationAgent to generate context-aware questions.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../../config/logger';

const logger = createLogger();

// Path to context files directory
const CONTEXT_DIR = path.join(__dirname, '../../../../context');

// Engineering task type definitions with question focus areas
// IDs must match client/src/constants/engineeringTaskTypes.ts
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
 * Load content from selected context files
 */
export async function loadContextContents(contextIds: string[]): Promise<string> {
  if (!contextIds || contextIds.length === 0) {
    return '';
  }

  logger.info('Loading context files', { contextIds });

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

      logger.info('Loaded context file', { contextId, title });
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

/**
 * Build complete context section for agent prompt
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
