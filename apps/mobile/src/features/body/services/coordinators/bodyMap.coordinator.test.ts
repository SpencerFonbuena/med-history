import { describe, it, expect } from 'vitest';
import { makeBodyMapCoordinator, type BodyMapPort } from './bodyMap.coordinator';
import type { BodyRegion } from '@med-history/core';

const regions: BodyRegion[] = [
  { code: 'knee-right', label: 'Right Knee', zone: 'leg', side: 'right' },
];

function fakePort(over: Partial<BodyMapPort> = {}): BodyMapPort {
  return {
    listRegions: async () => regions,
    countsByRegion: async () => new Map<string | null, number>([['knee-right', 1]]),
    ...over,
  };
}

describe('body map coordinator', () => {
  it('loads a built map with lit regions', async () => {
    const c = makeBodyMapCoordinator(fakePort());
    const r = await c.loadMap('p1');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.front.find((d) => d.code === 'knee-right')?.lit).toBe(true);
    }
  });

  it('wraps thrown errors as err', async () => {
    const c = makeBodyMapCoordinator(
      fakePort({ listRegions: async () => { throw new Error('db down'); } }),
    );
    const r = await c.loadMap('p1');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('db down');
  });
});
