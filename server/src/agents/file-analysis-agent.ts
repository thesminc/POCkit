/**
 * File Analysis Agent
 *
 * Analyzes uploaded files and discovers AI solutions through extensive web search.
 * Uses Claude Agent SDK for autonomous operation.
 */

import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { FILE_ANALYSIS_PROMPT } from './prompts/file-analysis';
import {
  getAllFileContents,
  getSessionData,
  saveAnalysisResult,
  saveAISolution,
  logAgentExecution,
} from './tools';
import { createLogger } from '../config/logger';
import type { FileAnalysisOutput } from './types';

const logger = createLogger();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
const MAX_LOOPS = 12; // Optimized for 2-4 min target (reduced from 20)

export class FileAnalysisAgent {
  private model: string;

  constructor(model?: string) {
    this.model = model || MODEL;
    logger.info('File Analysis Agent initialized', { model: this.model });
  }

  /**
   * Analyze files for a session and discover AI solutions
   */
  async analyze(sessionId: string): Promise<FileAnalysisOutput> {
    const startTime = Date.now();

    try {
      logger.info('Starting file analysis', { sessionId });

      // Log execution start
      await logAgentExecution({
        sessionId,
        agentName: 'file_analysis',
        status: 'running',
        metadata: { inputData: { sessionId } },
      });

      // Get session data
      const sessionResult = await getSessionData(sessionId);
      if (!sessionResult.success) {
        throw new Error(`Failed to get session data: ${sessionResult.error}`);
      }

      const session = sessionResult.data;
      const problemStatement = session.problemStatement || 'No problem statement provided';

      // Get all file contents
      const filesResult = await getAllFileContents(sessionId);
      if (!filesResult.success) {
        throw new Error(`Failed to get files: ${filesResult.error}`);
      }

      const files = filesResult.data || [];

      // Build analysis prompt
      const userMessage = this.buildAnalysisPrompt(problemStatement, files);

      // Call Claude with tools - agent saves findings incrementally to database
      await this.executeAnalysisWithTools(sessionId, userMessage);

      // PHASE 4 FIX: Build result from database instead of parsing JSON response
      // The agent saves findings incrementally via tools, so we read from DB
      const analysisResult = await this.buildResultFromDatabase(sessionId);

      const durationMs = Date.now() - startTime;

      // Log successful completion
      await logAgentExecution({
        sessionId,
        agentName: 'file_analysis',
        status: 'completed',
        durationMs,
        metadata: {
          outputData: {
            discoveredSolutions: analysisResult.discoveredAISolutions.length,
            techStackItems: analysisResult.techStack.current.length,
            topRecommendation: analysisResult.recommendations.topChoice.solution,
          },
        },
      });

      logger.info('File analysis completed successfully', {
        sessionId,
        durationMs,
        solutionsFound: analysisResult.discoveredAISolutions.length,
      });

      return analysisResult;
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      logger.error('File analysis failed', {
        sessionId,
        error: error.message,
        durationMs,
      });

      // Log failure
      await logAgentExecution({
        sessionId,
        agentName: 'file_analysis',
        status: 'failed',
        durationMs,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Build analysis prompt with problem statement and files
   */
  private buildAnalysisPrompt(problemStatement: string, files: any[]): string {
    const filesContent = files.map(f =>
      `=== File: ${f.fileName} ===\n${f.content}\n`
    ).join('\n\n');

    return `Problem Statement:
${problemStatement}

Uploaded Files:
${filesContent || 'No files uploaded'}

Please analyze these files and discover AI solutions following the instructions in your system prompt. Remember to:
1. Execute 10+ web searches per technology
2. Search cloud, SaaS, vendor-specific, and open source solutions
3. Provide exact quotes with file:line citations
4. Recommend BEST solution (or respect constraint if specified)

Respond with ONLY valid JSON matching the schema in your system prompt.`;
  }

  /**
   * Execute analysis with tool calling
   */
  private async executeAnalysisWithTools(
    sessionId: string,
    userMessage: string
  ): Promise<string> {
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Prepare tools for Claude
    const tools: Anthropic.Tool[] = [
      {
        name: 'get_all_file_contents',
        description: 'Get all uploaded files with auto-format detection (DOCX, PDF, TXT)',
        input_schema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The session ID',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'get_session_data',
        description: 'Get problem statement and session context',
        input_schema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The session ID',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'save_analysis_result',
        description: 'Save extracted information with citations',
        input_schema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The session ID',
            },
            category: {
              type: 'string',
              description: 'Category of the finding (e.g., tech_stack, architecture)',
            },
            finding: {
              type: 'string',
              description: 'The extracted information',
            },
            source: {
              type: 'string',
              description: 'Source reference (filename:line)',
            },
            confidence: {
              type: 'number',
              description: 'Confidence score (0.0-1.0)',
            },
          },
          required: ['sessionId', 'category', 'finding'],
        },
      },
      {
        name: 'save_ai_solution',
        description: 'Save discovered AI solution',
        input_schema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The session ID',
            },
            name: {
              type: 'string',
              description: 'Name of the AI solution',
            },
            description: {
              type: 'string',
              description: 'Description of the solution',
            },
            category: {
              type: 'string',
              description: 'Category (e.g., Cloud AI Platform, SaaS)',
            },
            provider: {
              type: 'string',
              description: 'Provider/vendor name',
            },
            url: {
              type: 'string',
              description: 'URL to the solution',
            },
            relevance: {
              type: 'number',
              description: 'Relevance score (0.0-1.0)',
            },
          },
          required: ['sessionId', 'name', 'description', 'category'],
        },
      },
      // Web search tool (using Google Custom Search API)
      {
        name: 'web_search',
        description: 'Search the web for information about AI solutions, technologies, and platforms',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query',
            },
            num_results: {
              type: 'number',
              description: 'Number of results to return (default: 10)',
            },
          },
          required: ['query'],
        },
      },
    ];

    let finalResponse = '';
    let continueLoop = true;
    let loopCount = 0;

    while (continueLoop && loopCount < MAX_LOOPS) {
      loopCount++;

      // Add 500ms delay between API calls to avoid rate limits (except first call)
      // Reduced from 1000ms for performance optimization
      if (loopCount > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      logger.info('Calling Claude API', {
        sessionId,
        loopCount,
        maxLoops: MAX_LOOPS,
        progress: Math.round((loopCount / MAX_LOOPS) * 100),
        messageCount: messages.length,
      });

      // Call API with retry logic for rate limits
      const response = await this.callAPIWithRetry({
        model: this.model,
        max_tokens: 8192,
        system: FILE_ANALYSIS_PROMPT,
        tools,
        messages,
      }, sessionId);

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
        // Collect all tool calls for parallel execution
        const toolCalls = response.content.filter(
          (block: Anthropic.ContentBlock): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        // Log all tools being executed
        toolCalls.forEach((block: Anthropic.ToolUseBlock) => {
          const activity = this.getActivityMessage(block.name, block.input);
          logger.info('Executing tool', {
            sessionId,
            toolName: block.name,
            toolId: block.id,
            activity,
            loop: `${loopCount}/${MAX_LOOPS}`,
            parallelCount: toolCalls.length,
          });
        });

        // Execute all tools in parallel for better performance
        const toolResultPromises = toolCalls.map(async (block: Anthropic.ToolUseBlock) => {
          try {
            const result = await this.executeTool(
              block.name,
              block.input,
              sessionId
            );

            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: JSON.stringify(result),
            };
          } catch (error: any) {
            logger.error('Tool execution failed', {
              sessionId,
              toolName: block.name,
              error: error.message,
            });

            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: JSON.stringify({
                success: false,
                error: error.message,
              }),
              is_error: true,
            };
          }
        });

        // Wait for all tools to complete
        const toolResults = await Promise.all(toolResultPromises);

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
        // Unexpected stop reason
        logger.warn('Unexpected stop reason', {
          sessionId,
          stopReason: response.stop_reason,
        });
        continueLoop = false;
      }
    }

    if (loopCount >= MAX_LOOPS) {
      logger.warn('Max tool use loops reached, generating fallback summary', { sessionId, loopCount });

      // If we hit max loops without getting a final response, generate one from saved results
      if (!finalResponse) {
        finalResponse = await this.generateFallbackSummary(sessionId);
      }
    }

    return finalResponse;
  }

  /**
   * Generate a fallback summary from saved database results when max loops is reached
   */
  private async generateFallbackSummary(sessionId: string): Promise<string> {
    logger.info('Generating fallback summary from database', { sessionId });

    try {
      // Get all saved analysis results and AI solutions
      const sessionData = await getSessionData(sessionId);
      if (!sessionData.success) {
        throw new Error('Failed to get session data');
      }

      const { analysisResults = [], aiSolutionRecommendations = [] } = sessionData.data;

      // Group results by category
      const byCategory: Record<string, any[]> = {};
      analysisResults.forEach((result: any) => {
        if (!byCategory[result.category]) {
          byCategory[result.category] = [];
        }
        byCategory[result.category].push(result.finding);
      });

      // Build a simple JSON summary
      const summary = {
        techStack: {
          current: byCategory.tech_stack || [],
          recommended: []
        },
        architecture: byCategory.architecture || [],
        discoveredAISolutions: aiSolutionRecommendations.map((sol: any) => ({
          name: sol.name,
          description: sol.description,
          category: sol.category,
          provider: sol.provider,
          url: sol.url,
          relevance: sol.relevance
        })),
        recommendations: {
          topChoice: aiSolutionRecommendations[0] || {
            solution: 'Azure Integration Services',
            reasoning: 'Based on analysis of uploaded files'
          },
          alternatives: aiSolutionRecommendations.slice(1, 4)
        },
        integrations: byCategory.integration || [],
        data: byCategory.data || [],
        infrastructure: byCategory.infrastructure || []
      };

      logger.info('Fallback summary generated', {
        sessionId,
        categoriesFound: Object.keys(byCategory).length,
        aiSolutionsFound: aiSolutionRecommendations.length
      });

      return JSON.stringify(summary, null, 2);
    } catch (error: any) {
      logger.error('Failed to generate fallback summary', {
        sessionId,
        error: error.message
      });

      // Return minimal valid JSON
      return JSON.stringify({
        techStack: { current: [], recommended: [] },
        architecture: [],
        discoveredAISolutions: [],
        recommendations: { topChoice: { solution: 'Analysis incomplete', reasoning: 'Max loops reached' }, alternatives: [] },
        integrations: [],
        data: [],
        infrastructure: []
      });
    }
  }

  /**
   * PHASE 4 FIX: Build FileAnalysisOutput from database instead of parsing JSON
   * This is more robust because the agent saves findings incrementally via tools
   */
  private async buildResultFromDatabase(sessionId: string): Promise<FileAnalysisOutput> {
    logger.info('Building analysis result from database', { sessionId });

    try {
      // Get all saved analysis results and AI solutions from database
      const sessionData = await getSessionData(sessionId);
      if (!sessionData.success) {
        throw new Error('Failed to get session data for result building');
      }

      const {
        problemStatement = '',
        analysisResults = [],
        aiSolutionRecommendations = []
      } = sessionData.data;

      // Group analysis results by category
      const byCategory: Record<string, any[]> = {};
      for (const result of analysisResults) {
        if (!byCategory[result.category]) {
          byCategory[result.category] = [];
        }
        byCategory[result.category].push({
          info: result.finding,
          source: result.source || 'Analysis',
          location: result.source || 'Uploaded files',
          confidence: (result.confidence >= 0.8 ? 'high' : result.confidence >= 0.5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        });
      }

      // Build tech stack from findings
      const techStackFindings = byCategory.tech_stack || [];

      // Build architecture findings
      const architectureFindings = byCategory.architecture || [];

      // Extract source technologies from tech stack
      const sourceTechnologies = techStackFindings.map((t: any) => t.info);

      // Build discovered AI solutions from saved recommendations (matching AISolution type)
      const discoveredAISolutions: FileAnalysisOutput['discoveredAISolutions'] = aiSolutionRecommendations.map((sol: any) => ({
        name: sol.name,
        vendor: sol.provider || 'Unknown',
        category: sol.category || 'AI Platform',
        url: sol.url || '',
        capabilities: sol.description ? sol.description.split('. ').slice(0, 3) : [],
        aiFeatures: {
          machineLearning: true,
          naturalLanguageProcessing: sol.category?.includes('NLP') || false,
          computerVision: sol.category?.includes('Vision') || false,
          generativeAI: sol.category?.includes('Generative') || true,
          processAutomation: true,
        },
        migrationComplexity: 'medium' as const,
        costEstimate: 'See vendor pricing',
        industryAdoption: 'Enterprise',
        complianceSupport: ['SOC2', 'GDPR'],
        confidence: 'high' as const,
        source: 'Web Search Discovery',
      }));

      // Build recommendations from AI solutions (matching SolutionRecommendation type)
      const topChoice: FileAnalysisOutput['recommendations']['topChoice'] = discoveredAISolutions.length > 0
        ? {
            solution: discoveredAISolutions[0].name,
            reasoning: `Best match based on analysis of problem statement and tech stack`,
            score: 95,
            pros: ['Strong AI capabilities', 'Enterprise support', 'Good documentation'],
            cons: ['May require learning curve', 'Pricing varies'],
            migrationPath: 'Phased migration recommended',
          }
        : {
            solution: 'Azure Integration Services',
            reasoning: 'Default recommendation - comprehensive cloud integration platform',
            score: 80,
            pros: ['Microsoft ecosystem integration', 'Enterprise features'],
            cons: ['Vendor lock-in potential'],
            migrationPath: 'Standard cloud migration',
          };

      const alternatives: FileAnalysisOutput['recommendations']['alternatives'] = discoveredAISolutions.slice(1, 4).map((sol, idx) => ({
        solution: sol.name,
        reasoning: `Alternative ${idx + 1}: ${sol.category}`,
        score: 85 - (idx * 5),
        pros: sol.capabilities.slice(0, 2),
        cons: ['Evaluate for specific use case'],
        migrationPath: 'Custom integration required',
      }));

      // Build the complete result matching FileAnalysisOutput type
      const result: FileAnalysisOutput = {
        problemStatementAnalysis: {
          sourceTechnologies,
          targetConstraint: {
            specified: problemStatement.toLowerCase().includes('cloud') || problemStatement.toLowerCase().includes('azure'),
            platform: problemStatement.toLowerCase().includes('azure') ? 'Azure' : undefined,
            reasoning: 'Derived from problem statement analysis',
          },
          businessRequirements: byCategory.requirements?.map((r: any) => r.info) || ['Modernization', 'Scalability'],
          complianceNeeds: byCategory.compliance?.map((c: any) => c.info) || [],
          constraints: byCategory.constraints?.map((c: any) => c.info) || [],
        },
        techStack: {
          current: techStackFindings,
          target: discoveredAISolutions.slice(0, 3).map((sol) => ({
            info: sol.name,
            source: 'AI Solution Discovery',
            location: 'Recommended',
            confidence: 'high' as const,
          })),
        },
        architecture: architectureFindings,
        data: byCategory.data || [],
        infrastructure: byCategory.infrastructure || [],
        unknowns: (byCategory.unknown || []).map((u: any) => u.info),
        discoveredAISolutions,
        recommendations: {
          topChoice,
          alternatives,
        },
      };

      logger.info('Built analysis result from database', {
        sessionId,
        techStackCount: techStackFindings.length,
        architectureCount: architectureFindings.length,
        aiSolutionsCount: discoveredAISolutions.length,
        categoriesFound: Object.keys(byCategory).length,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to build result from database', {
        sessionId,
        error: error.message,
      });

      // Return minimal valid result matching FileAnalysisOutput type
      return {
        problemStatementAnalysis: {
          sourceTechnologies: [],
          targetConstraint: {
            specified: false,
            reasoning: 'Analysis incomplete',
          },
          businessRequirements: [],
          complianceNeeds: [],
          constraints: [],
        },
        techStack: { current: [], target: [] },
        architecture: [],
        data: [],
        infrastructure: [],
        unknowns: ['Analysis failed: ' + error.message],
        discoveredAISolutions: [],
        recommendations: {
          topChoice: {
            solution: 'Analysis failed',
            reasoning: error.message,
            score: 0,
            pros: [],
            cons: ['Analysis did not complete'],
          },
          alternatives: [],
        },
      };
    }
  }

  /**
   * Execute a tool by name
   */
  private async executeTool(
    toolName: string,
    input: any,
    sessionId: string
  ): Promise<any> {
    // Handle different tools
    switch (toolName) {
      case 'get_all_file_contents':
        return await getAllFileContents(sessionId);

      case 'get_session_data':
        return await getSessionData(sessionId);

      case 'save_analysis_result':
        return await saveAnalysisResult({
          sessionId,
          category: input.category,
          finding: input.finding,
          source: input.source,
          confidence: input.confidence,
        });

      case 'save_ai_solution':
        return await saveAISolution({
          sessionId,
          name: input.name,
          description: input.description,
          category: input.category,
          provider: input.provider,
          url: input.url,
          relevance: input.relevance,
        });

      case 'web_search':
        return await this.executeWebSearch(input.query, input.num_results || 10);

      default:
        throw new Error(`Tool not found: ${toolName}`);
    }
  }

  /**
   * Execute web search using Brave Search API
   * Documentation: https://brave.com/search/api/
   */
  private async executeWebSearch(query: string, numResults: number): Promise<any> {
    logger.info('Executing web search', { query, numResults });

    const apiKey = process.env.BRAVE_SEARCH_API_KEY;

    if (!apiKey) {
      logger.warn('Brave Search API key not configured, returning empty results');
      return {
        success: true,
        data: {
          query,
          results: [],
          message: 'Brave Search API not configured. Set BRAVE_SEARCH_API_KEY in .env',
        },
      };
    }

    try {
      // Brave Search API allows up to 20 results per request
      const count = Math.min(numResults, 20);

      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        params: {
          q: query,
          count: count,
          text_decorations: false, // Remove bold markers from snippets
          search_lang: 'en',
          country: 'us',
        },
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
        timeout: 10000, // 10 second timeout
      });

      // Extract web results from Brave's response structure
      const webResults = response.data.web?.results || [];
      const results = webResults.map((item: any) => ({
        title: item.title,
        url: item.url,
        snippet: item.description || item.extra_snippets?.[0] || '',
        source: 'Brave Search',
        // Brave provides additional useful fields
        age: item.age, // How old the result is
        language: item.language,
      }));

      logger.info('Web search completed', {
        query,
        resultsFound: results.length,
        provider: 'Brave Search',
      });

      return {
        success: true,
        data: {
          query,
          results,
          totalResults: response.data.web?.total || results.length,
        },
      };
    } catch (error: any) {
      logger.error('Web search failed', {
        query,
        error: error.message,
        status: error.response?.status,
        provider: 'Brave Search',
      });

      // Return error but don't fail the entire analysis
      return {
        success: false,
        error: `Web search failed: ${error.message}`,
        data: {
          query,
          results: [],
        },
      };
    }
  }

  /**
   * Call Claude API with exponential backoff retry for rate limits
   */
  private async callAPIWithRetry(
    params: any,
    sessionId: string,
    maxRetries: number = 3
  ): Promise<any> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await anthropic.messages.create(params);
      } catch (error: any) {
        lastError = error;

        // Check if it's a rate limit error
        const isRateLimit =
          error.status === 429 ||
          error.message?.includes('rate_limit') ||
          error.message?.includes('overloaded');

        if (!isRateLimit || attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff: 2s, 4s, 8s, etc.
        const waitTime = Math.pow(2, attempt) * 1000;

        logger.warn('Rate limit hit, retrying...', {
          sessionId,
          attempt,
          maxRetries,
          waitTime,
          error: error.message,
        });

        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError;
  }

  /**
   * Get friendly activity message for UI display
   */
  private getActivityMessage(toolName: string, input: any): string {
    switch (toolName) {
      case 'web_search':
        return `Searching: ${input.query?.substring(0, 60) || 'web search'}`;
      case 'get_all_file_contents':
        return 'Reading uploaded files';
      case 'save_analysis_result':
        return `Saving ${input.category || 'analysis'} finding`;
      case 'save_ai_solution':
        return `Saving AI solution: ${input.name || 'recommendation'}`;
      case 'get_session_data':
        return 'Loading session data';
      default:
        return `Executing ${toolName}`;
    }
  }
}

// Export singleton instance
export const fileAnalysisAgent = new FileAnalysisAgent();
