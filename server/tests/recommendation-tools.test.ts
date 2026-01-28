/**
 * Unit tests for recommendation-tools.ts
 * Phase 5: Code Quality & Cleanup
 */

import type { TechStackItem } from '../src/agents/tools/recommendation-tools';

describe('Recommendation Tools', () => {
  describe('TechStackItem interface', () => {
    it('should accept valid tech stack items', () => {
      const item: TechStackItem = {
        name: 'BizTalk Server',
        category: 'integration',
        version: '2020',
        source: 'architecture.docx',
      };
      expect(item.name).toBe('BizTalk Server');
      expect(item.category).toBe('integration');
    });

    it('should work without optional fields', () => {
      const item: TechStackItem = {
        name: 'SQL Server',
        category: 'database',
      };
      expect(item.version).toBeUndefined();
      expect(item.source).toBeUndefined();
    });
  });

  describe('recommendTools', () => {
    // Note: Full integration tests would require mocking the context file reads
    // These are placeholder tests for the structure

    it('should be importable', async () => {
      const { recommendTools } = await import('../src/agents/tools/recommendation-tools');
      expect(typeof recommendTools).toBe('function');
    });

    it('should be callable with empty inputs', async () => {
      const { recommendTools } = await import('../src/agents/tools/recommendation-tools');
      const result = await recommendTools([], '', 5);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getQuickRecommendations', () => {
    it('should be importable', async () => {
      const { getQuickRecommendations } = await import('../src/agents/tools/recommendation-tools');
      expect(typeof getQuickRecommendations).toBe('function');
    });
  });
});
