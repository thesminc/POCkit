/**
 * Question Deduplication Service Tests
 * Tests the question similarity and deduplication logic
 */

import {
  handleDeduplicationResult,
  isSkipResponse,
  isAffirmativeResponse,
  isNegativeResponse,
  DeduplicationResult,
} from '../src/services/question-deduplication';

describe('Question Deduplication Service', () => {
  describe('handleDeduplicationResult', () => {
    it('should allow asking when no match found', () => {
      const result: DeduplicationResult = {
        matchFound: false,
        matchedQuestion: null,
        matchedAnswer: null,
        confidence: 0,
        reasoning: 'No match',
      };

      const handled = handleDeduplicationResult(result, 'What database are you using?');

      expect(handled.shouldAsk).toBe(true);
      expect(handled.message).toBe('What database are you using?');
    });

    it('should not ask when high confidence match found', () => {
      const result: DeduplicationResult = {
        matchFound: true,
        matchedQuestion: 'What database do you use?',
        matchedAnswer: 'PostgreSQL',
        confidence: 0.95,
        reasoning: 'Same question about database',
      };

      const handled = handleDeduplicationResult(result, 'What database are you using?');

      expect(handled.shouldAsk).toBe(false);
      expect(handled.answer).toBe('PostgreSQL');
      expect(handled.message).toContain('similar to one already answered');
    });

    it('should warn for low confidence matches', () => {
      const result: DeduplicationResult = {
        matchFound: true,
        matchedQuestion: 'What database do you use?',
        matchedAnswer: 'PostgreSQL',
        confidence: 0.6,
        reasoning: 'Possibly similar',
      };

      const handled = handleDeduplicationResult(result, 'Which DB technology?');

      expect(handled.shouldAsk).toBe(false);
      expect(handled.message).toContain('below 70%');
    });
  });

  describe('isSkipResponse', () => {
    it('should detect skip keywords', () => {
      expect(isSkipResponse('skip')).toBe(true);
      expect(isSkipResponse('SKIP')).toBe(true);
      expect(isSkipResponse('pass')).toBe(true);
      expect(isSkipResponse('next')).toBe(true);
      expect(isSkipResponse('n/a')).toBe(true);
      expect(isSkipResponse('not applicable')).toBe(true);
      expect(isSkipResponse("don't know")).toBe(true);
      expect(isSkipResponse('unknown')).toBe(true);
    });

    it('should not detect non-skip responses', () => {
      expect(isSkipResponse('PostgreSQL')).toBe(false);
      expect(isSkipResponse('yes we use MySQL')).toBe(false);
      expect(isSkipResponse('the answer is 42')).toBe(false);
    });
  });

  describe('isAffirmativeResponse', () => {
    it('should detect affirmative responses', () => {
      expect(isAffirmativeResponse('yes')).toBe(true);
      expect(isAffirmativeResponse('YES')).toBe(true);
      expect(isAffirmativeResponse('yeah')).toBe(true);
      expect(isAffirmativeResponse('yep')).toBe(true);
      expect(isAffirmativeResponse('correct')).toBe(true);
      expect(isAffirmativeResponse('right')).toBe(true);
      expect(isAffirmativeResponse('true')).toBe(true);
      expect(isAffirmativeResponse('confirm')).toBe(true);
    });

    it('should not detect non-affirmative responses', () => {
      expect(isAffirmativeResponse('no')).toBe(false);
      expect(isAffirmativeResponse('PostgreSQL')).toBe(false);
      expect(isAffirmativeResponse('maybe')).toBe(false);
    });
  });

  describe('isNegativeResponse', () => {
    it('should detect negative responses', () => {
      expect(isNegativeResponse('no')).toBe(true);
      expect(isNegativeResponse('NO')).toBe(true);
      expect(isNegativeResponse('nope')).toBe(true);
      expect(isNegativeResponse('wrong')).toBe(true);
      expect(isNegativeResponse('incorrect')).toBe(true);
      expect(isNegativeResponse('false')).toBe(true);
      expect(isNegativeResponse('negative')).toBe(true);
    });

    it('should not detect non-negative responses', () => {
      expect(isNegativeResponse('yes')).toBe(false);
      expect(isNegativeResponse('PostgreSQL')).toBe(false);
      expect(isNegativeResponse('maybe')).toBe(false);
    });
  });
});
