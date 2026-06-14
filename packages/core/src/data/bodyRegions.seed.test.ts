// packages/core/src/data/bodyRegions.seed.test.ts
import { describe, it, expect } from 'vitest';
import { BODY_REGIONS } from './bodyRegions.seed';

describe('BODY_REGIONS', () => {
  it('has the expected count and unique codes', () => {
    expect(BODY_REGIONS.length).toBe(40);
    expect(new Set(BODY_REGIONS.map((r) => r.code)).size).toBe(40);
  });

  it('parses side from the code suffix', () => {
    const knee = BODY_REGIONS.find((r) => r.code === 'knee-right')!;
    expect(knee.label).toBe('Right Knee');
    expect(knee.side).toBe('right');
    expect(knee.zone).toBe('leg');

    const nose = BODY_REGIONS.find((r) => r.code === 'nose')!;
    expect(nose.side).toBeNull();
    expect(nose.zone).toBe('head');
  });
});
