/**
 * Code Context Agent
 *
 * Phase 3 Enhancement #1: Generates context files from uploaded codebase files.
 * This allows POCkit to understand and recommend tools from ANY codebase,
 * not just the pre-configured Engineering IQ, CognitiveIQ, and GCP Repo Analyzer.
 *
 * Input: Uploaded code files (from session)
 * Output: Generated context file saved to /context/context_user_[sessionId].md
 */

import Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'fs';
import path from 'path';
import { getSessionData, getAllFileContents, logAgentExecution } from './tools';
import { createLogger } from '../config/logger';

const logger = createLogger();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
const CONTEXT_DIR = path.join(__dirname, '../../../context');

/**
 * System prompt for Code Context Agent
 * Based on the 0-CONTEXT_FILE_TEMPLATE.md structure
 */
const CODE_CONTEXT_PROMPT = `You are a Code Context Generator for POCkit, an AI-powered POC generation system.

Your task is to analyze the provided codebase and generate a comprehensive context documentation file that can be used by the POC generation system to recommend and integrate tools/agents from this codebase.

## Your Task

### 1. Identify the Project
From the source code, extract:
- Project/framework name (from package.json, setup.py, README, or folder name)
- Version (if available)
- Core purpose and philosophy
- Technology stack (languages, frameworks, databases)

### 2. Discover All Agents/Tools/Services
Scan the code for:
- Agent classes, tool functions, CLI commands, API endpoints
- Look for patterns: *Agent, *Tool, *Service, *Handler, *Controller
- Functions with @tool, @command, @api decorators
- Exported functions that perform specific tasks

### 3. Document Each Agent/Tool Found
For EVERY agent/tool discovered, document using this format:

#### [N]. [Agent/Tool Name]
**ID:** \`[exact_id_from_source]\`
**Source:** \`[file_path:line_number]\`
**Purpose:** [One sentence description]

**Key Capabilities:**
- [Capability 1]
- [Capability 2]

**Input Requirements:**
- \`param_name\` (type): description - Required/Optional

**Output:**
- Returns: [return type and structure]

**POC Use Cases:**
- [When to use this in a POC]

### 4. Categorize by Type
Group discovered items under:
- **Analysis Agents** - Agents that analyze code/data
- **Generator Agents** - Agents that generate output (reports, code, docs)
- **Utility Tools** - Helper functions and utilities
- **API Endpoints** - REST/GraphQL endpoints
- **CLI Commands** - Command-line interfaces

### 5. Document Architecture Patterns
Identify common usage patterns:
- How components work together
- Data flow between agents
- Configuration patterns

### 6. Create Quick Reference
Generate tables summarizing:
- Tool selection by use case
- All tool IDs in one list
- Key configuration options

## Output Format

Generate a markdown document with this EXACT structure:

\`\`\`markdown
# [Project Name]: [Tagline]

**Purpose:** [Brief description]
**Tech Stack:** [Languages, frameworks]
**Source:** User-uploaded codebase

---

## Overview
[2-3 paragraphs about what this codebase does]

## POC Use Cases
[What kinds of POCs can be built using this codebase]

---

## Available Tools & Agents

### [Category] Tools

#### 1. [Tool Name]
[Full documentation]

---

## Architecture Patterns
[How to use these tools together]

---

## Quick Reference

| Tool | Purpose | Use When |
|------|---------|----------|
| ... | ... | ... |

---

## Integration Notes
[How to integrate with POCkit workflows]
\`\`\`

## Rules

1. ONLY document what EXISTS in the provided code
2. Use EXACT names, IDs, and parameters from the source
3. Include file paths (Source: path/file.ts:L42)
4. If unclear, mark as [INFERRED] or [NEEDS VERIFICATION]
5. Do NOT invent capabilities that don't exist
6. Focus on what's useful for POC generation`;

export interface CodeContextOutput {
  contextId: string;
  contextPath: string;
  projectName: string;
  toolsFound: number;
  contentLength: number;
  generationTime: number;
}

export class CodeContextAgent {
  private model: string;

  constructor(model?: string) {
    this.model = model || MODEL;
    logger.info('Code Context Agent initialized', { model: this.model });
  }

  /**
   * Generate a context file from uploaded code files
   */
  async generateContext(sessionId: string): Promise<CodeContextOutput> {
    const startTime = Date.now();

    try {
      logger.info('Starting code context generation', { sessionId });

      // Log execution start
      await logAgentExecution({
        sessionId,
        agentName: 'code_context',
        status: 'running',
      });

      // Get session data
      const sessionResult = await getSessionData(sessionId);
      if (!sessionResult.success) {
        throw new Error(`Failed to get session data: ${sessionResult.error}`);
      }

      const session = sessionResult.data;
      const problemStatement = session.problemStatement || '';

      // Get all file contents
      const filesResult = await getAllFileContents(sessionId);
      if (!filesResult.success) {
        throw new Error(`Failed to get files: ${filesResult.error}`);
      }

      const files = filesResult.data || [];

      if (files.length === 0) {
        throw new Error('No files uploaded for context generation');
      }

      // Build the code content for analysis
      const codeContent = this.buildCodeContent(files);

      logger.info('Calling Claude API for context generation', {
        sessionId,
        fileCount: files.length,
        contentLength: codeContent.length,
      });

      // Call Claude to generate context
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 16384, // Context files can be large
        system: CODE_CONTEXT_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Generate a context documentation file for the following codebase.

Problem Statement (for context): ${problemStatement}

## Uploaded Code Files

${codeContent}

---

Generate the context file now. Remember to:
1. Extract all agents, tools, services, and utilities
2. Document each with proper formatting
3. Include file paths as sources
4. Create a quick reference table
5. Focus on what's useful for POC generation`,
          },
        ],
      });

      // Extract text content
      let contextContent = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          contextContent = block.text;
        }
      }

      // Extract project name from the generated content
      const projectNameMatch = contextContent.match(/^#\s+([^:\n]+)/m);
      const projectName = projectNameMatch
        ? projectNameMatch[1].trim()
        : `User Project ${sessionId.substring(0, 8)}`;

      // Count tools found
      const toolsFound = (contextContent.match(/####\s+\d+\./g) || []).length;

      // Generate context file ID and path
      const contextId = `context_user_${sessionId.substring(0, 8)}`;
      const contextPath = path.join(CONTEXT_DIR, `${contextId}.md`);

      // Save context file
      await fs.writeFile(contextPath, contextContent, 'utf-8');

      const durationMs = Date.now() - startTime;

      // Log successful completion
      await logAgentExecution({
        sessionId,
        agentName: 'code_context',
        status: 'completed',
        durationMs,
        metadata: {
          contextId,
          projectName,
          toolsFound,
          contentLength: contextContent.length,
        },
      });

      logger.info('Code context generation completed', {
        sessionId,
        contextId,
        projectName,
        toolsFound,
        durationMs,
        contentLength: contextContent.length,
      });

      return {
        contextId,
        contextPath,
        projectName,
        toolsFound,
        contentLength: contextContent.length,
        generationTime: durationMs,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      logger.error('Code context generation failed', {
        sessionId,
        error: error.message,
        durationMs,
      });

      // Log failure
      await logAgentExecution({
        sessionId,
        agentName: 'code_context',
        status: 'failed',
        durationMs,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Build code content string from uploaded files
   */
  private buildCodeContent(files: any[]): string {
    const sections: string[] = [];

    for (const file of files) {
      const extension = path.extname(file.fileName).toLowerCase();

      // Determine language for syntax highlighting
      const langMap: Record<string, string> = {
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.py': 'python',
        '.java': 'java',
        '.go': 'go',
        '.rs': 'rust',
        '.rb': 'ruby',
        '.php': 'php',
        '.cs': 'csharp',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'c',
        '.sql': 'sql',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.json': 'json',
        '.md': 'markdown',
        '.txt': 'text',
      };

      const lang = langMap[extension] || 'text';

      sections.push(`### File: ${file.fileName}
\`\`\`${lang}
${file.content}
\`\`\`
`);
    }

    return sections.join('\n\n');
  }

  /**
   * Delete a generated context file
   */
  async deleteContext(contextId: string): Promise<boolean> {
    try {
      const contextPath = path.join(CONTEXT_DIR, `${contextId}.md`);
      await fs.unlink(contextPath);
      logger.info('Deleted context file', { contextId });
      return true;
    } catch (error: any) {
      logger.warn('Failed to delete context file', {
        contextId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * List all user-generated context files
   */
  async listUserContexts(): Promise<string[]> {
    try {
      const files = await fs.readdir(CONTEXT_DIR);
      return files
        .filter(f => f.startsWith('context_user_') && f.endsWith('.md'))
        .map(f => f.replace('.md', ''));
    } catch (error: any) {
      logger.error('Failed to list user contexts', { error: error.message });
      return [];
    }
  }
}

// Export singleton instance
export const codeContextAgent = new CodeContextAgent();
