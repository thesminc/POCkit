/**
 * Validation Tools for Claude Agents
 * POCkit Tool
 *
 * Provides validation utilities for agent outputs including:
 * - JSON schema validation
 * - Citation format checking
 * - Confidence score validation
 * - Anti-hallucination checks
 */

import { createLogger } from '../../config/logger';
import type { ToolResult } from '../types';

const logger = createLogger();

/**
 * Validate JSON schema against expected structure
 * Used by agents to validate their outputs
 */
export async function validateJsonSchema(params: {
  data: any;
  schema: 'file_analysis' | 'question_generation' | 'poc_generation';
}): Promise<ToolResult<boolean>> {
  try {
    logger.info('Validating JSON schema', {
      schema: params.schema,
    });

    let isValid = false;
    const errors: string[] = [];

    switch (params.schema) {
      case 'file_analysis':
        isValid = validateFileAnalysisSchema(params.data, errors);
        break;
      case 'question_generation':
        isValid = validateQuestionGenerationSchema(params.data, errors);
        break;
      case 'poc_generation':
        isValid = validatePocGenerationSchema(params.data, errors);
        break;
      default:
        return {
          success: false,
          error: `Unknown schema: ${params.schema}`,
        };
    }

    if (!isValid) {
      return {
        success: false,
        error: `Schema validation failed: ${errors.join(', ')}`,
      };
    }

    return {
      success: true,
      data: isValid,
    };
  } catch (error: any) {
    logger.error('Failed to validate JSON schema', {
      error: error.message,
      params,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if citation format is valid
 * Citations must include file reference and quote
 */
export async function checkCitationFormat(params: {
  sourceReference: string;
  quote: string;
}): Promise<ToolResult<boolean>> {
  try {
    logger.info('Checking citation format');

    const errors: string[] = [];

    // Check source reference format (should be like "file.txt:42" or "file.txt:page2")
    const refPattern = /^.+:(line\s?)?\d+$|^.+:page\s?\d+$/i;
    if (!refPattern.test(params.sourceReference)) {
      errors.push('Source reference must be in format "filename:line42" or "filename:page2"');
    }

    // Check quote is not empty
    if (!params.quote || params.quote.trim().length === 0) {
      errors.push('Quote cannot be empty');
    }

    // Check quote is not too short (at least 10 characters)
    if (params.quote && params.quote.trim().length < 10) {
      errors.push('Quote must be at least 10 characters long');
    }

    // Check quote is not generic (anti-hallucination)
    const genericPhrases = [
      'not provided',
      'details not available',
      'see document',
      'refer to file',
      'n/a',
      'information not available',
      'refer to the document',
      'see the attached',
    ];

    for (const phrase of genericPhrases) {
      if (params.quote && params.quote.toLowerCase().includes(phrase)) {
        errors.push(`Quote contains generic phrase: "${phrase}"`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join('. '),
      };
    }

    return {
      success: true,
      data: true,
    };
  } catch (error: any) {
    logger.error('Failed to check citation format', {
      error: error.message,
      params,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Validate confidence score is in valid range
 */
export async function validateConfidenceScore(score: number): Promise<ToolResult<boolean>> {
  try {
    if (typeof score !== 'number') {
      return {
        success: false,
        error: 'Confidence score must be a number',
      };
    }

    if (score < 0 || score > 1) {
      return {
        success: false,
        error: 'Confidence score must be between 0 and 1',
      };
    }

    return {
      success: true,
      data: true,
    };
  } catch (error: any) {
    logger.error('Failed to validate confidence score', {
      error: error.message,
      score,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

// Schema validation helpers

function validateFileAnalysisSchema(data: any, errors: string[]): boolean {
  if (!data) {
    errors.push('Data is null or undefined');
    return false;
  }

  // Check required top-level fields
  const requiredFields = ['techStack', 'architecture', 'unknowns'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check techStack structure
  if (data.techStack) {
    if (!('current' in data.techStack)) {
      errors.push('techStack missing "current" field');
    }
    if (!('target' in data.techStack)) {
      errors.push('techStack missing "target" field');
    }

    // Check arrays
    if (data.techStack.current && !Array.isArray(data.techStack.current)) {
      errors.push('techStack.current must be an array');
    }
    if (data.techStack.target && !Array.isArray(data.techStack.target)) {
      errors.push('techStack.target must be an array');
    }
  }

  // Check discoveredAISolutions if present
  if (data.discoveredAISolutions) {
    if (!Array.isArray(data.discoveredAISolutions)) {
      errors.push('discoveredAISolutions must be an array');
    } else {
      for (const solution of data.discoveredAISolutions) {
        if (!solution.name || !solution.vendor) {
          errors.push('Each AI solution must have name and vendor');
        }
      }
    }
  }

  return errors.length === 0;
}

function validateQuestionGenerationSchema(data: any, errors: string[]): boolean {
  if (!data) {
    errors.push('Data is null or undefined');
    return false;
  }

  if (!data.questions || !Array.isArray(data.questions)) {
    errors.push('questions must be an array');
    return false;
  }

  for (const question of data.questions) {
    if (!question.id) errors.push('Question missing id');
    if (!question.question) errors.push('Question missing question text');
    if (!question.category) errors.push('Question missing category');
    if (typeof question.canSkip !== 'boolean') errors.push('Question missing canSkip boolean');
  }

  return errors.length === 0;
}

function validatePocGenerationSchema(data: any, errors: string[]): boolean {
  if (!data) {
    errors.push('Data is null or undefined');
    return false;
  }

  if (!data.content || typeof data.content !== 'string') {
    errors.push('content must be a string');
  }

  if (data.content && data.content.length < 500) {
    errors.push('POC content seems too short (< 500 characters)');
  }

  // Check for generic phrases (anti-hallucination)
  const genericPhrases = [
    'details not provided',
    'information not available',
    'refer to the document',
    'see the attached',
  ];

  for (const phrase of genericPhrases) {
    if (data.content && data.content.toLowerCase().includes(phrase)) {
      errors.push(`POC contains generic phrase: "${phrase}"`);
    }
  }

  // Check for required sections
  const requiredSections = [
    'Executive Summary',
    'Current State',
    'Target Architecture',
    'Migration Approach',
  ];

  for (const section of requiredSections) {
    if (data.content && !data.content.includes(section)) {
      errors.push(`POC missing required section: ${section}`);
    }
  }

  return errors.length === 0;
}

// Export tools for Agent SDK
export const validationTools = [
  {
    name: 'validate_json_schema',
    description: 'Validate data against expected JSON schema',
    input_schema: {
      type: 'object',
      properties: {
        data: { type: 'object', description: 'Data to validate' },
        schema: {
          type: 'string',
          enum: ['file_analysis', 'question_generation', 'poc_generation'],
          description: 'Schema type to validate against',
        },
      },
      required: ['data', 'schema'],
    },
    execute: validateJsonSchema,
  },
  {
    name: 'check_citation_format',
    description: 'Verify that citation has proper format with source reference and quote',
    input_schema: {
      type: 'object',
      properties: {
        sourceReference: { type: 'string', description: 'Source reference (e.g., "file.txt:42")' },
        quote: { type: 'string', description: 'Exact quote from source' },
      },
      required: ['sourceReference', 'quote'],
    },
    execute: checkCitationFormat,
  },
  {
    name: 'validate_confidence_score',
    description: 'Validate confidence score is between 0 and 1',
    input_schema: {
      type: 'object',
      properties: {
        score: { type: 'number', description: 'Confidence score to validate' },
      },
      required: ['score'],
    },
    execute: async (params: any) => validateConfidenceScore(params.score),
  },
];
