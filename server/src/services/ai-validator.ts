/**
 * AI Validator Service - Anti-hallucination defense
 * Migrated from AICT
 *
 * Enforces strict confidence thresholds and citation validation
 * to prevent AI hallucinations in generated content.
 */

import { createLogger } from '../config/logger';

const logger = createLogger();

// STRICT confidence thresholds - never relax these
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.90,     // Can state as fact WITH citation
  MEDIUM: 0.70,   // Must express uncertainty, ask for confirmation
  LOW: 0.50,      // Must ask validation question
  NONE: 0.0,      // Cannot make any claim
} as const;

export interface Finding {
  type: string;
  value: string;
  sourceReference: string;
  quote: string;
  confidence: number;
  needsValidation?: boolean;
}

export interface ValidationResult {
  action: 'state_with_citation' | 'express_uncertainty' | 'ask_for_confirmation' | 'ask_open_question';
  message: string;
  needsValidation: boolean;
  confidenceLevel: 'high' | 'medium' | 'low' | 'none';
}

/**
 * AIValidator enforces anti-hallucination rules
 *
 * CRITICAL: This is the primary defense against AI hallucinations
 */
export class AIValidator {
  /**
   * Validate a finding based on confidence score
   */
  validateFinding(finding: Finding): ValidationResult {
    const confidence = finding.confidence;

    // HIGH confidence (>=90%): Can state as fact WITH citation
    if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
      return {
        action: 'state_with_citation',
        message: this.formatHighConfidenceMessage(finding),
        needsValidation: false,
        confidenceLevel: 'high',
      };
    }

    // MEDIUM confidence (>=70%): Express uncertainty
    if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
      return {
        action: 'express_uncertainty',
        message: this.formatMediumConfidenceMessage(finding),
        needsValidation: true,
        confidenceLevel: 'medium',
      };
    }

    // LOW confidence (>=50%): Ask for confirmation
    if (confidence >= CONFIDENCE_THRESHOLDS.LOW) {
      return {
        action: 'ask_for_confirmation',
        message: this.formatLowConfidenceMessage(finding),
        needsValidation: true,
        confidenceLevel: 'low',
      };
    }

    // NONE (<50%): Ask open question
    return {
      action: 'ask_open_question',
      message: this.formatNoConfidenceMessage(finding),
      needsValidation: true,
      confidenceLevel: 'none',
    };
  }

  /**
   * Format message for high confidence finding (>=90%)
   */
  private formatHighConfidenceMessage(finding: Finding): string {
    return `Found: ${finding.value}

**Source:** ${finding.sourceReference}
**Quote:** "${finding.quote}"
**Confidence:** ${(finding.confidence * 100).toFixed(0)}%`;
  }

  /**
   * Format message for medium confidence finding (70-89%)
   */
  private formatMediumConfidenceMessage(finding: Finding): string {
    return `I believe this might be ${finding.value}, but I'm not completely certain.

**Source:** ${finding.sourceReference}
**Quote:** "${finding.quote}"
**Confidence:** ${(finding.confidence * 100).toFixed(0)}%

**Please confirm:** Is this correct?`;
  }

  /**
   * Format message for low confidence finding (50-69%)
   */
  private formatLowConfidenceMessage(finding: Finding): string {
    return `Based on ${finding.sourceReference}, this could be ${finding.value}, but I'm uncertain.

**Quote:** "${finding.quote}"
**Confidence:** ${(finding.confidence * 100).toFixed(0)}%

**Question:** Can you confirm if this is ${finding.value}?`;
  }

  /**
   * Format message for no confidence (<50%)
   */
  private formatNoConfidenceMessage(finding: Finding): string {
    return `I couldn't determine the ${finding.type} with certainty.

**What I found:** "${finding.quote}" in ${finding.sourceReference}

**Question:** What is the ${finding.type} for this system?`;
  }

  /**
   * Validate that a finding has required citations
   */
  validateCitation(finding: Finding): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Source reference is mandatory
    if (!finding.sourceReference || finding.sourceReference.trim() === '') {
      errors.push('Missing source reference (file:line or file:page)');
    }

    // Quote is mandatory
    if (!finding.quote || finding.quote.trim() === '') {
      errors.push('Missing exact quote from source file');
    }

    // Source reference should include file and location
    if (finding.sourceReference && !finding.sourceReference.includes(':')) {
      errors.push('Source reference must include location (file:line or file:page)');
    }

    // Confidence score must be between 0 and 1
    if (finding.confidence < 0 || finding.confidence > 1) {
      errors.push(`Invalid confidence score: ${finding.confidence} (must be 0.0-1.0)`);
    }

    const valid = errors.length === 0;

    if (!valid) {
      logger.warn('Citation validation failed', {
        finding: finding.value,
        errors,
      });
    }

    return { valid, errors };
  }

  /**
   * Batch validate multiple findings
   */
  validateFindings(findings: Finding[]): {
    valid: Finding[];
    invalid: Array<{ finding: Finding; errors: string[] }>;
    needsValidation: Finding[];
  } {
    const valid: Finding[] = [];
    const invalid: Array<{ finding: Finding; errors: string[] }> = [];
    const needsValidation: Finding[] = [];

    for (const finding of findings) {
      const citationCheck = this.validateCitation(finding);

      if (!citationCheck.valid) {
        invalid.push({ finding, errors: citationCheck.errors });
        continue;
      }

      const validation = this.validateFinding(finding);

      if (validation.needsValidation) {
        needsValidation.push(finding);
      }

      valid.push(finding);
    }

    logger.info('Batch validation complete', {
      total: findings.length,
      valid: valid.length,
      invalid: invalid.length,
      needsValidation: needsValidation.length,
    });

    return { valid, invalid, needsValidation };
  }

  /**
   * Check if hallucination rate is within acceptable threshold
   *
   * Hallucination = findings with invalid citations or confidence manipulation
   */
  calculateHallucinationRate(findings: Finding[]): {
    rate: number;
    acceptable: boolean;
    details: string;
  } {
    const { invalid } = this.validateFindings(findings);
    const hallucinationCount = invalid.length;
    const rate = findings.length > 0 ? hallucinationCount / findings.length : 0;
    const acceptable = rate < 0.05; // Must be <5%

    const details = `${hallucinationCount} hallucinations out of ${findings.length} findings (${(rate * 100).toFixed(1)}%)`;

    if (!acceptable) {
      logger.error('Hallucination rate exceeds threshold', {
        rate,
        threshold: 0.05,
        details,
      });
    }

    return { rate, acceptable, details };
  }

  /**
   * Generate validation questions for uncertain findings
   */
  generateValidationQuestions(findings: Finding[]): string[] {
    const questions: string[] = [];

    for (const finding of findings) {
      if (finding.needsValidation || finding.confidence < CONFIDENCE_THRESHOLDS.HIGH) {
        const validation = this.validateFinding(finding);

        // Extract question from validation message
        if (validation.action === 'ask_for_confirmation' || validation.action === 'ask_open_question') {
          const questionMatch = validation.message.match(/\*\*Question:\*\* (.+)/);
          if (questionMatch) {
            questions.push(questionMatch[1]);
          }
        } else if (validation.action === 'express_uncertainty') {
          const confirmMatch = validation.message.match(/\*\*Please confirm:\*\* (.+)/);
          if (confirmMatch) {
            questions.push(confirmMatch[1]);
          }
        }
      }
    }

    return questions;
  }
}

// Export singleton instance
export const aiValidator = new AIValidator();
