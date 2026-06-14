import type { BodyRegion } from '@med-history/core';
import { FRONT_DOTS, BACK_DOTS, type DotPosition } from '../../data/bodyDots';
import type { Dot, BodyMap } from '../../schemas/bodyMap';

/**
 * Merge seeded regions and per-region entry counts onto the static dot tables.
 *
 * The dot tables are the canonical set of placed markers; each is joined to its
 * region label (falling back to the code) and lit when it has at least one entry.
 * `generalCount` is the count of region-less (region_code IS NULL) entries.
 */
export function buildBodyMap(
  regions: BodyRegion[],
  counts: Map<string | null, number>,
): BodyMap {
  const labels = new Map(regions.map((r) => [r.code, r.label]));

  const toDot = (d: DotPosition): Dot => ({
    code: d.code,
    label: labels.get(d.code) ?? d.code,
    cx: d.cx,
    cy: d.cy,
    lit: (counts.get(d.code) ?? 0) > 0,
  });

  return {
    front: FRONT_DOTS.map(toDot),
    back: BACK_DOTS.map(toDot),
    generalCount: counts.get(null) ?? 0,
  };
}
