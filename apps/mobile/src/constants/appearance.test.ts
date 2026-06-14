import { describe, it, expect } from 'vitest';
import { SIZE_LEVELS, SIZE_LABELS, textScale, figureScale } from './appearance';

describe('appearance constants', () => {
  it('has 5 levels with labels', () => {
    expect(SIZE_LEVELS).toEqual([1, 2, 3, 4, 5]);
    expect(SIZE_LABELS[1]).toBe('Default');
    expect(SIZE_LABELS[5]).toBe('Very large');
  });

  it('maps levels to multipliers (level 1 is identity)', () => {
    expect(textScale(1)).toBe(1);
    expect(figureScale(1)).toBe(1);
    expect(textScale(5)).toBe(2);
    expect(figureScale(5)).toBeCloseTo(1.45);
  });
});
