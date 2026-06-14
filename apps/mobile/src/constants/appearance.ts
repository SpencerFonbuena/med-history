export const SIZE_LEVELS = [1, 2, 3, 4, 5] as const;
export type SizeLevel = (typeof SIZE_LEVELS)[number];

export const SIZE_LABELS: Record<SizeLevel, string> = {
  1: 'Default',
  2: 'Large',
  3: 'Larger',
  4: 'Extra large',
  5: 'Very large',
};

const TEXT_SCALE: Record<SizeLevel, number> = { 1: 1.0, 2: 1.15, 3: 1.35, 4: 1.65, 5: 2.0 };
const FIGURE_SCALE: Record<SizeLevel, number> = { 1: 1.0, 2: 1.08, 3: 1.18, 4: 1.3, 5: 1.45 };

export const textScale = (level: SizeLevel): number => TEXT_SCALE[level];
export const figureScale = (level: SizeLevel): number => FIGURE_SCALE[level];
