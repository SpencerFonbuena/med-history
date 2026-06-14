import { describe, it, expect } from 'vitest';
import { baseType, scaleType } from './typography';

describe('typography', () => {
  it('level 1 returns the base sizes', () => {
    expect(scaleType(1)).toEqual(baseType);
  });

  it('level 5 doubles and rounds', () => {
    const t = scaleType(5);
    expect(t.body).toBe(Math.round(baseType.body * 2));
    expect(t.hero).toBe(Math.round(baseType.hero * 2));
  });
});
