import { describe, it, expect } from 'vitest';
import { calcAge, toIsoDate } from './date';

describe('calcAge', () => {
  const now = new Date(2026, 5, 13); // 2026-06-13 (month is 0-based)
  it('counts a birthday already passed this year', () => {
    expect(calcAge('1990-01-02', now)).toBe(36);
  });
  it('subtracts one when the birthday has not happened yet', () => {
    expect(calcAge('1990-12-31', now)).toBe(35);
  });
  it('counts the birthday itself as the new age', () => {
    expect(calcAge('2000-06-13', now)).toBe(26);
  });
});

describe('toIsoDate', () => {
  it('formats local Y-M-D with zero padding', () => {
    expect(toIsoDate(new Date(2001, 2, 4))).toBe('2001-03-04');
  });
});
