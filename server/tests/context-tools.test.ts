/**
 * Unit tests for context-tools.ts
 * Phase 5: Code Quality & Cleanup
 *
 * Note: Auto-detection was removed in favor of manual context selection.
 * Users select contexts in the UI.
 */

import {
  getAvailableContexts,
  AVAILABLE_CONTEXTS,
} from '../src/agents/tools/context-tools';

describe('Context Tools', () => {
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

    it('should have required metadata fields', () => {
      for (const context of AVAILABLE_CONTEXTS) {
        expect(context.id).toBeDefined();
        expect(context.name).toBeDefined();
        expect(context.description).toBeDefined();
      }
    });
  });
});
