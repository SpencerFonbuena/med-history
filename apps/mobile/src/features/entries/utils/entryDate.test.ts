import { describe, it, expect } from 'vitest';
import { formatEntryDate } from './entryDate';

describe('formatEntryDate', () => {
  it('formats an ISO date as "Mon D, YYYY"', () => {
    expect(formatEntryDate('2026-01-02')).toBe('Jan 2, 2026');
  });
  it('does not zero-pad the day and handles December', () => {
    expect(formatEntryDate('2026-12-25')).toBe('Dec 25, 2026');
  });
});
