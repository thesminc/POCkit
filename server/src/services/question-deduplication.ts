/**
 * Question Deduplication Service
 * Migrated from AICT
 *
 * Uses semantic matching to avoid asking redundant questions
 * that have already been answered in different wording.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createLogger } from '../config/logger';

const logger = createLogger();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

// Types
export interface DeduplicationResult {
  matchFound: boolean;
  matchedQuestion: string | null;
  matchedAnswer: string | null;
  confidence: number;
  reasoning: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  timestamp?: Date;
}

// System prompt for deduplication
const QUESTION_DEDUPLICATION_PROMPT = `You are a semantic similarity checker for questions.

Your task is to determine if a new question is semantically equivalent to any previously answered questions.

Two questions are semantically similar if:
1. They ask for the same information, even if worded differently
2. The answer to one would fully satisfy the other
3. They have the same intent, even with different phrasing

Return your analysis as JSON with this structure:
{
  "matchFound": boolean,
  "matchedQuestion": string | null,  // The original question that matches
  "matchedAnswer": string | null,    // The answer to that question
  "confidence": number,              // 0.0-1.0 confidence in the match
  "reasoning": string                // Brief explanation
}

Be conservative - only report a match if you're confident (>0.7) the questions are truly equivalent.`;

/**
 * Check if a new question is semantically similar to any answered questions
 */
export async function deduplicateQuestion(
  newQuestion: string,
  answeredQuestions: QuestionAnswer[]
): Promise<DeduplicationResult> {
  if (answeredQuestions.length === 0) {
    return {
      matchFound: false,
      matchedQuestion: null,
      matchedAnswer: null,
      confidence: 0,
      reasoning: 'No previous questions to compare against'
    };
  }

  const userMessage = `New Question: "${newQuestion}"

Previously Answered Questions:
${answeredQuestions.map((qa, idx) =>
  `${idx + 1}. Q: "${qa.question}"\n   A: "${qa.answer}"`
).join('\n\n')}

Is the new question semantically similar to any of the previously answered questions?`;

  try {
    logger.info('Checking question deduplication', {
      newQuestion: newQuestion.substring(0, 50),
      previousCount: answeredQuestions.length,
    });

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: QUESTION_DEDUPLICATION_PROMPT,
      messages: [{
        role: 'user',
        content: userMessage
      }]
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from deduplication');
    }

    // Parse JSON response
    const result = JSON.parse(textContent.text) as DeduplicationResult;

    logger.info('Deduplication result', {
      matchFound: result.matchFound,
      confidence: result.confidence,
    });

    return result;

  } catch (error: any) {
    logger.error('Error in question deduplication', { error: error.message });
    // Fail open - assume no match on error
    return {
      matchFound: false,
      matchedQuestion: null,
      matchedAnswer: null,
      confidence: 0,
      reasoning: 'Error during deduplication check'
    };
  }
}

/**
 * Handle deduplication result and return appropriate message/action
 */
export function handleDeduplicationResult(
  result: DeduplicationResult,
  originalQuestion: string
): {
  shouldAsk: boolean;
  message: string;
  answer?: string;
} {
  if (!result.matchFound) {
    return {
      shouldAsk: true,
      message: originalQuestion
    };
  }

  // Match found - use existing answer
  let message = `This question is similar to one already answered:\n\nOriginal: "${result.matchedQuestion}"\nConfidence: ${Math.round(result.confidence * 100)}%`;

  // Add warning for low confidence matches
  if (result.confidence < 0.7) {
    message += `\n\nNote: Match confidence is below 70%. Consider asking anyway.`;
  }

  return {
    shouldAsk: false,
    message,
    answer: result.matchedAnswer!
  };
}

/**
 * Check if user response indicates they want to skip the question
 */
export function isSkipResponse(response: string): boolean {
  const skipKeywords = ['skip', 'pass', 'next', 'n/a', 'not applicable', 'don\'t know', 'unknown'];
  const normalized = response.toLowerCase().trim();
  return skipKeywords.some(keyword => normalized === keyword || normalized.includes(keyword));
}

/**
 * Check if user response is affirmative
 */
export function isAffirmativeResponse(response: string): boolean {
  const affirmativeKeywords = ['yes', 'yeah', 'yep', 'correct', 'right', 'true', 'confirm', 'affirmative'];
  const normalized = response.toLowerCase().trim();
  return affirmativeKeywords.some(keyword => normalized === keyword);
}

/**
 * Check if user response is negative
 */
export function isNegativeResponse(response: string): boolean {
  const negativeKeywords = ['no', 'nope', 'wrong', 'incorrect', 'false', 'negative'];
  const normalized = response.toLowerCase().trim();
  return negativeKeywords.some(keyword => normalized === keyword);
}

/**
 * Batch deduplicate multiple questions
 * Returns only questions that should be asked (not duplicates)
 */
export async function filterDuplicateQuestions(
  newQuestions: string[],
  answeredQuestions: QuestionAnswer[]
): Promise<{ question: string; isDuplicate: boolean; matchedAnswer?: string }[]> {
  const results: { question: string; isDuplicate: boolean; matchedAnswer?: string }[] = [];

  for (const question of newQuestions) {
    const dedupResult = await deduplicateQuestion(question, answeredQuestions);

    results.push({
      question,
      isDuplicate: dedupResult.matchFound && dedupResult.confidence >= 0.7,
      matchedAnswer: dedupResult.matchedAnswer || undefined,
    });
  }

  logger.info('Batch deduplication complete', {
    total: newQuestions.length,
    duplicates: results.filter(r => r.isDuplicate).length,
    unique: results.filter(r => !r.isDuplicate).length,
  });

  return results;
}
