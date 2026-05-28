import { describe, it, expect } from 'vitest';

describe('Indicator Scoring Logic', () => {
  function calculateScore(actualValue: number | null, minBound: number | null, maxBound: number | null): { status: string; score: number } {
    if (actualValue === null || isNaN(actualValue)) {
      return { status: 'unknown', score: 0 };
    }

    const passMin = minBound !== null && minBound !== undefined;
    const passMax = maxBound !== null && maxBound !== undefined;

    let status: string = 'unknown';

    if (passMin && passMax) {
      status = (actualValue >= minBound! && actualValue <= maxBound!) ? 'pass' : 'fail';
    } else if (passMin) {
      status = actualValue >= minBound! ? 'pass' : 'fail';
    } else if (passMax) {
      status = actualValue <= maxBound! ? 'pass' : 'fail';
    }

    let score = 0;

    if (status === 'pass') {
      score = 1;
    } else if (passMin && passMax && maxBound! > minBound!) {
      const range = maxBound! - minBound!;
      if (actualValue < minBound!) {
        score = Math.max(0, 1 - (minBound! - actualValue) / range);
      } else {
        score = Math.max(0, 1 - (actualValue - maxBound!) / range);
      }
    } else {
      score = 0;
    }

    return { status, score };
  }

  it('should pass when value is within range', () => {
    const result = calculateScore(95, 90, 100);
    expect(result.status).toBe('pass');
    expect(result.score).toBe(1);
  });

  it('should pass when value equals min bound', () => {
    const result = calculateScore(90, 90, 100);
    expect(result.status).toBe('pass');
    expect(result.score).toBe(1);
  });

  it('should pass when value equals max bound', () => {
    const result = calculateScore(100, 90, 100);
    expect(result.status).toBe('pass');
    expect(result.score).toBe(1);
  });

  it('should fail with partial score when value is below min', () => {
    const result = calculateScore(85, 90, 100);
    expect(result.status).toBe('fail');
    expect(result.score).toBeCloseTo(0.5, 2);
  });

  it('should fail with partial score when value is above max', () => {
    const result = calculateScore(105, 90, 100);
    expect(result.status).toBe('fail');
    expect(result.score).toBeCloseTo(0.5, 2);
  });

  it('should give score 0 when value is far outside range', () => {
    const result = calculateScore(50, 90, 100);
    expect(result.status).toBe('fail');
    expect(result.score).toBe(0);
  });

  it('should give score 0 when value is far above range', () => {
    const result = calculateScore(200, 90, 100);
    expect(result.status).toBe('fail');
    expect(result.score).toBe(0);
  });

  it('should pass when only min bound is set and value >= min', () => {
    const result = calculateScore(95, 90, null);
    expect(result.status).toBe('pass');
    expect(result.score).toBe(1);
  });

  it('should fail when only min bound is set and value < min', () => {
    const result = calculateScore(85, 90, null);
    expect(result.status).toBe('fail');
    expect(result.score).toBe(0);
  });

  it('should pass when only max bound is set and value <= max', () => {
    const result = calculateScore(50, null, 100);
    expect(result.status).toBe('pass');
    expect(result.score).toBe(1);
  });

  it('should fail when only max bound is set and value > max', () => {
    const result = calculateScore(150, null, 100);
    expect(result.status).toBe('fail');
    expect(result.score).toBe(0);
  });

  it('should return unknown for null actual value', () => {
    const result = calculateScore(null, 90, 100);
    expect(result.status).toBe('unknown');
    expect(result.score).toBe(0);
  });

  it('should return unknown for NaN actual value', () => {
    const result = calculateScore(NaN, 90, 100);
    expect(result.status).toBe('unknown');
    expect(result.score).toBe(0);
  });

  it('should calculate score correctly near boundary', () => {
    const result = calculateScore(89, 90, 100);
    expect(result.status).toBe('fail');
    expect(result.score).toBeCloseTo(0.9, 2);
  });

  it('should handle zero range (min === max)', () => {
    const result = calculateScore(100, 100, 100);
    expect(result.status).toBe('pass');
    expect(result.score).toBe(1);
  });

  it('should handle zero range with different value', () => {
    const result = calculateScore(99, 100, 100);
    expect(result.status).toBe('fail');
    expect(result.score).toBe(0);
  });
});

describe('Overall Status Classification', () => {
  function getOverallStatus(score: number): string {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.5) return 'warning';
    return 'critical';
  }

  it('should classify excellent for score >= 0.9', () => {
    expect(getOverallStatus(0.95)).toBe('excellent');
    expect(getOverallStatus(0.9)).toBe('excellent');
  });

  it('should classify good for 0.7 <= score < 0.9', () => {
    expect(getOverallStatus(0.8)).toBe('good');
    expect(getOverallStatus(0.7)).toBe('good');
  });

  it('should classify warning for 0.5 <= score < 0.7', () => {
    expect(getOverallStatus(0.6)).toBe('warning');
    expect(getOverallStatus(0.5)).toBe('warning');
  });

  it('should classify critical for score < 0.5', () => {
    expect(getOverallStatus(0.4)).toBe('critical');
    expect(getOverallStatus(0)).toBe('critical');
  });
});

describe('Date Validation', () => {
  function isValidDateString(dateStr?: string): boolean {
    if (!dateStr) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  it('should accept valid date format', () => {
    expect(isValidDateString('2026-05-26')).toBe(true);
  });

  it('should accept empty/undefined date', () => {
    expect(isValidDateString(undefined)).toBe(true);
    expect(isValidDateString('')).toBe(true);
  });

  it('should reject invalid date formats', () => {
    expect(isValidDateString('2026/05/26')).toBe(false);
    expect(isValidDateString('26-05-2026')).toBe(false);
    expect(isValidDateString('2026-5-26')).toBe(false);
    expect(isValidDateString('not-a-date')).toBe(false);
  });
});
