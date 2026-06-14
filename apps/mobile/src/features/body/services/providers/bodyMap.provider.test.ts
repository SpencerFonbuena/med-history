import { describe, it, expect } from 'vitest';
import { buildBodyMap } from './bodyMap.provider';
import type { BodyRegion } from '@med-history/core';

const regions: BodyRegion[] = [
  { code: 'knee-right', label: 'Right Knee', zone: 'leg', side: 'right' },
  { code: 'chest', label: 'Chest', zone: 'torso', side: null },
  { code: 'upper-back', label: 'Upper Back', zone: 'torso', side: null },
];

describe('buildBodyMap', () => {
  it('lights regions that have entries and leaves others dim', () => {
    const counts = new Map<string | null, number>([['knee-right', 2]]);
    const { front } = buildBodyMap(regions, counts);
    const knee = front.find((d) => d.code === 'knee-right');
    const chest = front.find((d) => d.code === 'chest');
    expect(knee?.lit).toBe(true);
    expect(knee?.label).toBe('Right Knee');
    expect(chest?.lit).toBe(false);
  });

  it('counts general (null) entries separately', () => {
    const counts = new Map<string | null, number>([[null, 3]]);
    expect(buildBodyMap(regions, counts).generalCount).toBe(3);
  });

  it('places back-only regions on the back view only', () => {
    const { front, back } = buildBodyMap(regions, new Map());
    expect(back.some((d) => d.code === 'upper-back')).toBe(true);
    expect(front.some((d) => d.code === 'upper-back')).toBe(false);
  });

  it('falls back to the code when the region has no seeded label', () => {
    const { front } = buildBodyMap([], new Map());
    expect(front.find((d) => d.code === 'chest')?.label).toBe('chest');
  });
});
