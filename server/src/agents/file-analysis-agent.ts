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
const MAX_LOOPS = 20; // Prevent excessive tool use loops

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

      // Call Claude with tools
      const response = await this.executeAnalysisWithTools(sessionId, userMessage);

      // Parse and validate response
      const analysisResult = this.parseAnalysisResponse(response);

      // Save results to database
      await this.saveAnalysisResults(sessionId, analysisResult);

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

      // Add 1 second delay between API calls to avoid rate limits (except first call)
      if (loopCount > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
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
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content) {
          if (block.type === 'tool_use') {
            // Get friendly activity message
            const activity = this.getActivityMessage(block.name, block.input);

            logger.info('Executing tool', {
              sessionId,
              toolName: block.name,
              toolId: block.id,
              activity,
              loop: `${loopCount}/${MAX_LOOPS}`,
            });

            try {
              const result = await this.executeTool(
                block.name,
                block.input,
                sessionId
              );

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
   * Execute web search using Google Custom Search API
   */
  private async executeWebSearch(query: string, numResults: number): Promise<any> {
    logger.info('Executing web search', { query, numResults });

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !cx) {
      logger.warn('Google Search API credentials not configured, returning empty results');
      return {
        success: true,
        data: {
          query,
          results: [],
          message: 'Google Search API not configured. Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID in .env',
        },
      };
    }

    try {
      // Google Custom Search allows max 10 results per request
      const num = Math.min(numResults, 10);

      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: apiKey,
          cx: cx,
          q: query,
          num: num,
        },
        timeout: 10000, // 10 second timeout
      });

      const results = response.data.items?.map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: 'Google Search',
      })) || [];

      logger.info('Web search completed', {
        query,
        resultsFound: results.length,
      });

      return {
        success: true,
        data: {
          query,
          results,
          totalResults: response.data.searchInformation?.totalResults || 0,
        },
      };
    } catch (error: any) {
      logger.error('Web search failed', {
        query,
        error: error.message,
        status: error.response?.status,
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
   * Parse and validate analysis response
   */
  private parseAnalysisResponse(response: string): FileAnalysisOutput {
    logger.info('Parsing analysis response', {
      responseLength: response.length,
      preview: response.substring(0, 100),
    });

    // Clean response - extract JSON from markdown code blocks
    let cleanText = response.trim();

    // Try to extract JSON from markdown code blocks (anywhere in the response)
    const jsonBlockMatch = cleanText.match(/```json\s*\n([\s\S]*?)\n```/);
    if (jsonBlockMatch) {
      cleanText = jsonBlockMatch[1].trim();
    } else {
      // Try without language specifier
      const codeBlockMatch = cleanText.match(/```\s*\n([\s\S]*?)\n```/);
      if (codeBlockMatch) {
        cleanText = codeBlockMatch[1].trim();
      } else if (cleanText.startsWith('```json')) {
        // Fallback: remove from start
        cleanText = cleanText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
    }

    // If still has explanatory text before JSON, try to extract just the JSON object
    if (!cleanText.startsWith('{')) {
      const jsonMatch = cleanText.match(/\{[\s\S]*\}$/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
    }

    // Parse JSON with error handling
    let result: FileAnalysisOutput;
    try {
      result = JSON.parse(cleanText) as FileAnalysisOutput;
    } catch (error: any) {
      logger.error('Failed to parse JSON response', {
        error: error.message,
        responsePreview: response.substring(0, 500),
        cleanTextPreview: cleanText.substring(0, 500),
        responseLength: response.length,
        cleanTextLength: cleanText.length,
      });

      // Try to give helpful error message
      const hint = !cleanText.startsWith('{')
        ? ' (Hint: Response does not start with JSON object)'
        : cleanText.includes('Based on')
        ? ' (Hint: Response contains explanatory text)'
        : '';

      throw new Error(
        `Invalid JSON response: ${error.message}${hint}. ` +
        `Cleaned text started with: "${cleanText.substring(0, 100)}"`
      );
    }

    // Validate structure (basic check)
    if (!result.problemStatementAnalysis) {
      throw new Error('Missing problemStatementAnalysis in response');
    }
    if (!result.techStack) {
      throw new Error('Missing techStack in response');
    }

    logger.info('Analysis response parsed successfully', {
      solutionsFound: result.discoveredAISolutions?.length || 0,
      techStackCurrent: result.techStack.current?.length || 0,
      unknowns: result.unknowns?.length || 0,
    });

    return result;
  }

  /**
   * Save analysis results to database
   */
  private async saveAnalysisResults(
    sessionId: string,
    result: FileAnalysisOutput
  ): Promise<void> {
    logger.info('Saving analysis results to database', { sessionId });

    // Save tech stack findings
    for (const item of result.techStack.current) {
      await saveAnalysisResult({
        sessionId,
        category: 'tech_stack',
        finding: item.info,
        confidence: item.confidence === 'high' ? 0.9 : item.confidence === 'medium' ? 0.7 : 0.5,
        source: item.location,
      });
    }

    // Save architecture findings
    for (const item of result.architecture) {
      await saveAnalysisResult({
        sessionId,
        category: 'architecture',
        finding: item.info,
        confidence: item.confidence === 'high' ? 0.9 : item.confidence === 'medium' ? 0.7 : 0.5,
        source: item.location,
      });
    }

    // Save AI solution recommendations
    if (result.discoveredAISolutions && result.discoveredAISolutions.length > 0) {
      for (let i = 0; i < result.discoveredAISolutions.length; i++) {
        const solution = result.discoveredAISolutions[i];
        await saveAISolution({
          sessionId,
          name: solution.name,
          description: `${solution.capabilities.join(', ')}. Migration complexity: ${solution.migrationComplexity}`,
          category: solution.category,
          provider: solution.vendor,
          url: solution.url,
          relevance: i === 0 ? 1.0 : Math.max(0.5, 1.0 - (i * 0.1)),
        });
      }
    }

    logger.info('Analysis results saved successfully', { sessionId });
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
