import { textScale, type SizeLevel } from './appearance';

export const baseType = {
  caption: 12,
  footnote: 13,
  body: 15,
  callout: 16,
  subtitle: 18,
  title: 20,
  largeTitle: 26,
  hero: 32,
} as const;

export type TypeScale = Record<keyof typeof baseType, number>;

/** Base type sizes multiplied by the level's text scale and rounded. */
export function scaleType(level: SizeLevel): TypeScale {
  const f = textScale(level);
  const out = {} as TypeScale;
  for (const key of Object.keys(baseType) as (keyof typeof baseType)[]) {
    out[key] = Math.round(baseType[key] * f);
  }
  return out;
}
