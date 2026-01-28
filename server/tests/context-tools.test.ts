/**
 * Unit tests for context-tools.ts
 * Phase 5: Code Quality & Cleanup
 */

import {
  detectRelevantContexts,
  getAvailableContexts,
  AVAILABLE_CONTEXTS,
} from '../src/agents/tools/context-tools';

describe('Context Tools', () => {
  describe('detectRelevantContexts', () => {
    it('should return empty array for empty problem statement', () => {
      const result = detectRelevantContexts('');
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only problem statement', () => {
      const result = detectRelevantContexts('   ');
      expect(result).toEqual([]);
    });

    it('should detect Engineering IQ for code analysis keywords', () => {
      const result = detectRelevantContexts('I need to analyze my codebase for migration');
      expect(result).toContain('context_engineering_iq');
    });

    it('should detect Engineering IQ for BizTalk migration', () => {
      const result = detectRelevantContexts('Migrate BizTalk to cloud with AI');
      expect(result).toContain('context_engineering_iq');
    });

    it('should detect CognitiveIQ for AI/ML keywords', () => {
      const result = detectRelevantContexts('Build a knowledge graph with semantic reasoning');
      expect(result).toContain('context_cognitive_iq');
    });

    it('should detect GCP Repo Analyzer for Google Cloud keywords', () => {
      const result = detectRelevantContexts('Analyze our GCP infrastructure and Kubernetes deployment');
      expect(result).toContain('context_gcp_repo_analyzer');
    });

    it('should return contexts sorted by relevance score', () => {
      // Problem with more Engineering IQ keywords should rank it first
      const result = detectRelevantContexts('code analysis testing security architecture migration');
      expect(result[0]).toBe('context_engineering_iq');
    });

    it('should detect multiple relevant contexts', () => {
      const result = detectRelevantContexts('GCP cloud infrastructure with AI cognitive processing');
      expect(result.length).toBeGreaterThan(1);
    });
  });

  describe('getAvailableContexts', () => {
    it('should return all available context metadata', () => {
      const contexts = getAvailableContexts();
      expect(contexts).toHaveLength(3);
    });

    it('should include Engineering IQ context', () => {
      const contexts = getAvailableContexts();
      const engineeringIQ = contexts.find(c => c.id === 'context_engineering_iq');
      expect(engineeringIQ).toBeDefined();
      expect(engineeringIQ?.name).toBe('Engineering IQ');
    });

    it('should include CognitiveIQ context', () => {
      const contexts = getAvailableContexts();
      const cognitiveIQ = contexts.find(c => c.id === 'context_cognitive_iq');
      expect(cognitiveIQ).toBeDefined();
      expect(cognitiveIQ?.name).toBe('CognitiveIQ');
    });

    it('should include GCP Repo Analyzer context', () => {
      const contexts = getAvailableContexts();
      const gcpRepo = contexts.find(c => c.id === 'context_gcp_repo_analyzer');
      expect(gcpRepo).toBeDefined();
      expect(gcpRepo?.name).toBe('GCP Repo Analyzer');
    });
  });

  describe('AVAILABLE_CONTEXTS', () => {
    it('should have keywords for each context', () => {
      for (const context of AVAILABLE_CONTEXTS) {
        expect(context.keywords.length).toBeGreaterThan(0);
      }
    });

    it('should have default sections for each context', () => {
      for (const context of AVAILABLE_CONTEXTS) {
        expect(context.defaultSections.length).toBeGreaterThan(0);
      }
    });

    it('should have valid filenames ending in .md', () => {
      for (const context of AVAILABLE_CONTEXTS) {
        expect(context.filename).toMatch(/\.md$/);
      }
    });
  });
});
