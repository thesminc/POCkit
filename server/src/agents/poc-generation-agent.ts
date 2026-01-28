/**
 * POC Generation Agent
 *
 * Generates comprehensive POC feasibility analysis documents by:
 * - Analyzing selected context files (existing codebases/frameworks)
 * - Determining feasibility (YES/NO/PARTIAL)
 * - Providing detailed implementation guidance or gap analysis
 *
 * Supports Business, Developer, and Combined output formats.
 */

import Anthropic from '@anthropic-ai/sdk';
import { buildPOCPrompt, POCFormat } from './prompts/poc-feasibility-template';
import { getSessionData, logAgentExecution, saveGeneratedPoc } from './tools/database-tools';
import { loadContextContents } from './tools/context-tools';
import { createLogger } from '../config/logger';
import type { POCGenerationOutput } from './types';

const logger = createLogger();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

export class POCGenerationAgent {
  private model: string;

  constructor(model?: string) {
    this.model = model || MODEL;
    logger.info('POC Generation Agent initialized', { model: this.model });
  }

  /**
   * Generate POC feasibility analysis for a session
   * @param sessionId - The session ID
   * @param pocFormat - Output format: 'business', 'developer', or 'both'
   */
  async generatePOC(sessionId: string, pocFormat: POCFormat = 'business'): Promise<POCGenerationOutput> {
    const startTime = Date.now();

    try {
      logger.info('Starting POC feasibility analysis', { sessionId, pocFormat });

      // Log execution start
      await logAgentExecution({
        sessionId,
        agentName: 'poc_generation',
        status: 'running',
      });

      // Get all context including context files
      const context = await this.gatherContext(sessionId);

      // Build POC generation prompt using new template system
      const userMessage = await this.buildPOCPromptWithContext(context, pocFormat);

      // Execute POC generation with tool calling
      const pocContent = await this.executePOCGeneration(sessionId, userMessage);

      // Parse and validate
      const result = this.parsePOCResponse(pocContent);

      // Save POC to database using the new function
      const durationMs = Date.now() - startTime;
      const saveResult = await saveGeneratedPoc({
        sessionId,
        content: result.content,
        wordCount: result.wordCount,
        sectionCount: result.includedSections.length,
        citationCount: result.citations,
        generationTime: durationMs,
      });

      if (saveResult.success && saveResult.data) {
        result.pocId = saveResult.data.id;
      }

      // Log successful completion
      await logAgentExecution({
        sessionId,
        agentName: 'poc_generation',
        status: 'completed',
        durationMs,
        metadata: {
          contentLength: result.content.length,
          wordCount: result.wordCount,
          sectionsIncluded: result.includedSections,
          recommendedTools: result.recommendedTools.length,
        },
      });

      logger.info('POC generation completed successfully', {
        sessionId,
        durationMs,
        contentLength: result.content.length,
        toolsRecommended: result.recommendedTools.length,
      });

      return result;
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      logger.error('POC generation failed', {
        sessionId,
        error: error.message,
        durationMs,
      });

      // Log failure
      await logAgentExecution({
        sessionId,
        agentName: 'poc_generation',
        status: 'failed',
        durationMs,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Gather all context needed for POC generation including context files
   */
  private async gatherContext(sessionId: string): Promise<any> {
    logger.info('Gathering POC generation context', { sessionId });

    // Get session data
    const sessionResult = await getSessionData(sessionId);
    if (!sessionResult.success) {
      throw new Error(`Failed to get session: ${sessionResult.error}`);
    }

    const session = sessionResult.data;

    // Extract analysis results by type (camelCase properties)
    const techStack = session.analysisResults?.filter((r: any) => r.category === 'tech_stack') || [];
    const architecture = session.analysisResults?.filter((r: any) => r.category === 'architecture') || [];
    const aiSolutions = session.aiSolutionRecommendations || [];

    // Get Q&A responses from QuestionQueue (new) or QuestionResponse (legacy)
    const questionQueue = session.questionQueue?.filter((q: any) => q.status === 'answered') || [];
    const qaResponses = questionQueue.length > 0 ? questionQueue : (session.questionResponses || []);

    // Load selected context files (NEW - for feasibility analysis)
    const selectedContexts = session.selectedContexts || [];
    const contextContent = await loadContextContents(selectedContexts);

    logger.info('Context gathered for POC', {
      sessionId,
      hasContextFiles: selectedContexts.length > 0,
      contextFileCount: selectedContexts.length,
      qaResponseCount: qaResponses.length,
    });

    return {
      sessionId,
      problemStatement: session.problemStatement || 'No problem statement provided',
      techStack,
      architecture,
      aiSolutions,
      qaResponses,
      selectedContexts,
      contextContent,
    };
  }

  /**
   * Build POC generation prompt using new template system with context files
   */
  private async buildPOCPromptWithContext(context: any, pocFormat: POCFormat): Promise<string> {
    // Format Q&A responses
    const qaResponsesSummary = context.qaResponses
      .map((qa: any) => `Q: ${qa.question}\nA: ${qa.answer || 'Not answered yet'}`)
      .join('\n\n');

    // Format additional context from file analysis (if any)
    const additionalContext = this.formatAdditionalContext(context);

    // Use the new template system
    const prompt = buildPOCPrompt(
      pocFormat,
      context.problemStatement,
      context.contextContent || '',
      qaResponsesSummary,
      additionalContext
    );

    logger.info('Built POC prompt with template', {
      pocFormat,
      contextLength: context.contextContent?.length || 0,
      qaResponseCount: context.qaResponses.length,
    });

    return prompt;
  }

  /**
   * Format additional context from file analysis results
   */
  private formatAdditionalContext(context: any): string {
    const parts: string[] = [];

    // Add tech stack findings
    if (context.techStack && context.techStack.length > 0) {
      const techStackSummary = context.techStack
        .map((item: any) => `- ${item.finding} (Source: ${item.source || 'Unknown'})`)
        .join('\n');
      parts.push(`### Tech Stack (from uploaded files)\n${techStackSummary}`);
    }

    // Add architecture findings
    if (context.architecture && context.architecture.length > 0) {
      const architectureSummary = context.architecture
        .map((item: any) => `- ${item.finding} (Source: ${item.source || 'Unknown'})`)
        .join('\n');
      parts.push(`### Architecture (from uploaded files)\n${architectureSummary}`);
    }

    // Add AI solutions discovered
    if (context.aiSolutions && context.aiSolutions.length > 0) {
      const aiSolutionsSummary = context.aiSolutions
        .map((solution: any) => `- ${solution.name}: ${solution.description || 'No description'}`)
        .join('\n');
      parts.push(`### AI Solutions Discovered\n${aiSolutionsSummary}`);
    }

    return parts.length > 0 ? parts.join('\n\n') : '';
  }

  /**
   * Execute POC generation with tool calling
   * CRITICAL FIX: max_tokens = 16384 (NOT 8192)
   */
  private async executePOCGeneration(sessionId: string, userMessage: string): Promise<string> {
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Prepare tools for Claude
    // Note: Framework tools removed - context files provide framework knowledge directly
    const tools: Anthropic.Tool[] = [];

    let finalResponse = '';
    let continueLoop = true;
    let loopCount = 0;
    const MAX_LOOPS = 15;

    while (continueLoop && loopCount < MAX_LOOPS) {
      loopCount++;

      logger.info('Calling Claude API for POC generation', {
        sessionId,
        loopCount,
      });

      // CRITICAL FIX: max_tokens = 16384 (NOT 8192)
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 16384, // CRITICAL: Must be 16384 for comprehensive POC documents
        system: `You are a POC Feasibility Analyst generating comprehensive feasibility analysis documents.

CRITICAL REQUIREMENTS:
1. OUTPUT FORMAT: Generate markdown directly - do NOT wrap in code blocks
2. START IMMEDIATELY with the title: "# Feasibility Analysis: [Request Title]"
3. FOLLOW THE TEMPLATE EXACTLY: Fill in ALL sections from the template
4. BE SPECIFIC: Reference actual component names, file paths, and code from the context files
5. MINIMUM LENGTH: The document must be at least 2500 words with detailed analysis
6. FEASIBILITY VERDICT: Clearly state YES/PARTIAL/NO based on what EXISTS in context files
7. CITE SOURCES: When referencing existing capabilities, cite which context file they come from

You MUST generate the COMPLETE document following the template structure provided in the user message. Do not abbreviate or skip sections.`,
        tools,
        messages,
      });

      logger.info('Claude API response received', {
        sessionId,
        stopReason: response.stop_reason,
        contentBlocks: response.content.length,
      });

      // Add assistant response to messages
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      // Check if we need to execute tools
      if (response.stop_reason === 'tool_use') {
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content) {
          if (block.type === 'tool_use') {
            logger.info('Executing tool for POC generation', {
              sessionId,
              toolName: block.name,
            });

            try {
              const result = await this.executeTool(block.name, block.input, sessionId);

              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify(result),
              });
            } catch (error: any) {
              logger.error('Tool execution failed', {
                sessionId,
                toolName: block.name,
                error: error.message,
              });

              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify({
                  success: false,
                  error: error.message,
                }),
                is_error: true,
              });
            }
          }
        }

        // Add tool results to messages
        messages.push({
          role: 'user',
          content: toolResults,
        });
      } else if (response.stop_reason === 'end_turn') {
        // Extract final text response
        for (const block of response.content) {
          if (block.type === 'text') {
            finalResponse = block.text;
          }
        }
        continueLoop = false;
      } else {
        logger.warn('Unexpected stop reason', {
          sessionId,
          stopReason: response.stop_reason,
        });
        continueLoop = false;
      }
    }

    if (loopCount >= MAX_LOOPS) {
      logger.warn('Max tool use loops reached for POC generation', { sessionId });
    }

    return finalResponse;
  }

  /**
   * Execute a tool by name
   * Note: Tool execution removed - no tools currently needed for POC generation
   * Context files provide all framework knowledge directly in the prompt
   */
  private async executeTool(toolName: string, _input: any, _sessionId: string): Promise<any> {
    throw new Error(`Tool execution not supported: ${toolName}`);
  }

  /**
   * Parse POC response
   * CRITICAL FIX: Simply find first # header and take everything from there
   * Do NOT try to extract from code blocks - it breaks with nested blocks
   */
  private parsePOCResponse(content: string): POCGenerationOutput {
    logger.info('Parsing POC response', {
      contentLength: content.length,
    });

    let cleanContent = content.trim();

    // FIXED: Find the FIRST markdown header (# at start of line) and take everything from there
    // This handles all cases: wrapped in code block, preceded by explanation, etc.
    const firstHeaderMatch = cleanContent.match(/^(#+\s+.+)/m);
    if (firstHeaderMatch) {
      // Find the index of the first header and take everything from there
      const headerIndex = cleanContent.indexOf(firstHeaderMatch[0]);
      if (headerIndex > 0) {
        cleanContent = cleanContent.substring(headerIndex).trim();
      }
    }

    // If content is wrapped in a markdown code block at the very end, remove closing ```
    // But be careful not to remove legitimate code blocks
    if (cleanContent.match(/\n```\s*$/)) {
      // Check if this is an unmatched closing - count opening vs closing
      const lines = cleanContent.split('\n');
      let codeBlockDepth = 0;
      let lastCodeBlockLine = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^```/)) {
          if (codeBlockDepth === 0 || !lines[i].match(/^```\s*$/)) {
            codeBlockDepth++;
          } else {
            codeBlockDepth--;
          }
          lastCodeBlockLine = i;
        }
      }

      // If we end with an unmatched closing ```, remove it
      if (codeBlockDepth < 0 && lastCodeBlockLine === lines.length - 1) {
        cleanContent = lines.slice(0, -1).join('\n').trim();
      }
    }

    logger.info('POC content extracted', {
      originalLength: content.length,
      cleanedLength: cleanContent.length,
      startsWithHeader: cleanContent.startsWith('#'),
    });

    // Extract sections
    const sections = this.extractSections(cleanContent);

    // Extract recommended tools
    const recommendedTools = this.extractRecommendedTools(cleanContent);

    // CRITICAL FIX: Calculate metrics properly
    const wordCount = cleanContent.split(/\s+/).filter(w => w.length > 0).length;
    const citationCount = (cleanContent.match(/[a-zA-Z0-9_.-]+:(line\s?)?\d+/g) || []).length;

    // Extract AI solutions mentioned
    const aiSolutions = this.extractAISolutions(cleanContent);

    logger.info('POC response parsed successfully', {
      contentLength: cleanContent.length,
      wordCount,
      sections: sections.length,
      toolsRecommended: recommendedTools.length,
      citations: citationCount,
    });

    return {
      content: cleanContent,
      includedSections: sections,
      aiSolutions,
      recommendedTools,
      citations: citationCount,
      wordCount,
    };
  }

  /**
   * Extract section headers
   */
  private extractSections(content: string): string[] {
    const sections: string[] = [];
    const headerPattern = /^##\s+(.+)$/gm;
    let match;

    while ((match = headerPattern.exec(content)) !== null) {
      sections.push(match[1].trim());
    }

    return sections;
  }

  /**
   * Extract recommended tools from POC content
   */
  private extractRecommendedTools(content: string): any[] {
    const tools: any[] = [];

    // Look for tool recommendations (simplified - actual parsing would be more sophisticated)
    const toolPattern = /####?\s+(.+?)\s+-\s+(.+?)\n\*\*Agent ID\*\*:\s*`([^`]+)`/g;
    let match;

    while ((match = toolPattern.exec(content)) !== null) {
      tools.push({
        framework: match[1].trim(),
        name: match[2].trim(),
        agentId: match[3].trim(),
      });
    }

    return tools;
  }

  /**
   * Extract AI solutions mentioned in POC
   */
  private extractAISolutions(content: string): string[] {
    const solutions: string[] = [];

    // Look for "Recommended AI Solution:" headers
    const solutionPattern = /###\s+Recommended AI Solution:\s+(.+?)(?:\n|$)/g;
    let match;

    while ((match = solutionPattern.exec(content)) !== null) {
      solutions.push(match[1].trim());
    }

    return solutions;
  }
}

// Export singleton instance
export const pocGenerationAgent = new POCGenerationAgent();
