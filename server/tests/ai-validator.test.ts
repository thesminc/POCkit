/**
 * AI Validator Service Tests
 * Tests the anti-hallucination defense system
 */

import { AIValidator, CONFIDENCE_THRESHOLDS, Finding } from '../src/services/ai-validator';

describe('AIValidator', () => {
  let validator: AIValidator;

  beforeEach(() => {
    validator = new AIValidator();
  });

  describe('validateFinding', () => {
    it('should return state_with_citation for high confidence (>=90%)', () => {
      const finding: Finding = {
        type: 'tech_stack',
        value: 'Node.js v18',
        sourceReference: 'package.json:5',
        quote: '"node": "18.x"',
        confidence: 0.95,
      };

      const result = validator.validateFinding(finding);

      expect(result.action).toBe('state_with_citation');
      expect(result.needsValidation).toBe(false);
      expect(result.confidenceLevel).toBe('high');
    });

    it('should return express_uncertainty for medium confidence (70-89%)', () => {
      const finding: Finding = {
        type: 'architecture',
        value: 'microservices',
        sourceReference: 'design.md:12',
        quote: 'services communicate via REST',
        confidence: 0.75,
      };

      const result = validator.validateFinding(finding);

      expect(result.action).toBe('express_uncertainty');
      expect(result.needsValidation).toBe(true);
      expect(result.confidenceLevel).toBe('medium');
    });

    it('should return ask_for_confirmation for low confidence (50-69%)', () => {
      const finding: Finding = {
        type: 'database',
        value: 'PostgreSQL',
        sourceReference: 'config.yaml:3',
        quote: 'db: postgres',
        confidence: 0.55,
      };

      const result = validator.validateFinding(finding);

      expect(result.action).toBe('ask_for_confirmation');
      expect(result.needsValidation).toBe(true);
      expect(result.confidenceLevel).toBe('low');
    });

    it('should return ask_open_question for no confidence (<50%)', () => {
      const finding: Finding = {
        type: 'infrastructure',
        value: 'AWS',
        sourceReference: 'unknown:0',
        quote: 'cloud deployment',
        confidence: 0.3,
      };

      const result = validator.validateFinding(finding);

      expect(result.action).toBe('ask_open_question');
      expect(result.needsValidation).toBe(true);
      expect(result.confidenceLevel).toBe('none');
    });
  });

  describe('validateCitation', () => {
    it('should pass valid citation', () => {
      const finding: Finding = {
        type: 'tech_stack',
        value: 'Express.js',
        sourceReference: 'server.ts:15',
        quote: 'import express from "express"',
        confidence: 0.9,
      };

      const result = validator.validateCitation(finding);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when source reference is missing', () => {
      const finding: Finding = {
        type: 'tech_stack',
        value: 'Express.js',
        sourceReference: '',
        quote: 'import express',
        confidence: 0.9,
      };

      const result = validator.validateCitation(finding);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing source reference (file:line or file:page)');
    });

    it('should fail when quote is missing', () => {
      const finding: Finding = {
        type: 'tech_stack',
        value: 'Express.js',
        sourceReference: 'server.ts:15',
        quote: '',
        confidence: 0.9,
      };

      const result = validator.validateCitation(finding);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing exact quote from source file');
    });

    it('should fail when source reference has no location', () => {
      const finding: Finding = {
        type: 'tech_stack',
        value: 'Express.js',
        sourceReference: 'server.ts',
        quote: 'import express',
        confidence: 0.9,
      };

      const result = validator.validateCitation(finding);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Source reference must include location (file:line or file:page)');
    });

    it('should fail when confidence is out of range', () => {
      const finding: Finding = {
        type: 'tech_stack',
        value: 'Express.js',
        sourceReference: 'server.ts:15',
        quote: 'import express',
        confidence: 1.5,
      };

      const result = validator.validateCitation(finding);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid confidence score');
    });
  });

  describe('validateFindings (batch)', () => {
    it('should categorize findings correctly', () => {
      const findings: Finding[] = [
        {
          type: 'tech_stack',
          value: 'Node.js',
          sourceReference: 'package.json:5',
          quote: '"node": "18"',
          confidence: 0.95,
        },
        {
          type: 'database',
          value: 'MongoDB',
          sourceReference: 'config.ts:10',
          quote: 'mongodb://localhost',
          confidence: 0.6,
        },
        {
          type: 'invalid',
          value: 'Unknown',
          sourceReference: '', // Invalid - missing
          quote: 'test',
          confidence: 0.5,
        },
      ];

      const result = validator.validateFindings(findings);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.needsValidation).toHaveLength(1); // Only the 0.6 confidence one
    });
  });

  describe('calculateHallucinationRate', () => {
    it('should return acceptable rate for valid findings', () => {
      const findings: Finding[] = [
        {
          type: 'tech_stack',
          value: 'Node.js',
          sourceReference: 'package.json:5',
          quote: '"node": "18"',
          confidence: 0.95,
        },
        {
          type: 'database',
          value: 'PostgreSQL',
          sourceReference: 'schema.prisma:1',
          quote: 'datasource db',
          confidence: 0.9,
        },
      ];

      const result = validator.calculateHallucinationRate(findings);

      expect(result.rate).toBe(0);
      expect(result.acceptable).toBe(true);
    });

    it('should return unacceptable rate for many invalid findings', () => {
      const findings: Finding[] = Array(10).fill({
        type: 'invalid',
        value: 'Unknown',
        sourceReference: '', // Invalid
        quote: '',
        confidence: 0.5,
      });

      const result = validator.calculateHallucinationRate(findings);

      expect(result.rate).toBe(1);
      expect(result.acceptable).toBe(false);
    });
  });

  describe('CONFIDENCE_THRESHOLDS', () => {
    it('should have correct threshold values', () => {
      expect(CONFIDENCE_THRESHOLDS.HIGH).toBe(0.90);
      expect(CONFIDENCE_THRESHOLDS.MEDIUM).toBe(0.70);
      expect(CONFIDENCE_THRESHOLDS.LOW).toBe(0.50);
      expect(CONFIDENCE_THRESHOLDS.NONE).toBe(0.0);
    });
  });
});
