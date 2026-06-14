// apps/mobile/src/features/body/data/bodyDots.ts

/** A region marker placed on the figure. Coordinates are in the BODY_VIEWBOX space. */
export interface DotPosition {
  code: string;
  cx: number;
  cy: number;
}

// Front + back marker positions, lifted verbatim from docs/mockups/body.html.
export const FRONT_DOTS: DotPosition[] = [
  { code: 'ear-left', cx: 88, cy: 15 },
  { code: 'eye-left', cx: 98, cy: 13 },
  { code: 'nose', cx: 103, cy: 19 },
  { code: 'eye-right', cx: 108, cy: 13 },
  { code: 'ear-right', cx: 119, cy: 15 },
  { code: 'mouth', cx: 103, cy: 24 },
  { code: 'shoulder-left', cx: 82, cy: 42 },
  { code: 'shoulder-right', cx: 124, cy: 42 },
  { code: 'chest', cx: 103, cy: 55 },
  { code: 'ribs', cx: 103, cy: 72 },
  { code: 'stomach', cx: 103, cy: 88 },
  { code: 'pelvis', cx: 103, cy: 108 },
  { code: 'hip-left', cx: 92, cy: 112 },
  { code: 'hip-right', cx: 114, cy: 112 },
  { code: 'elbow-left', cx: 79, cy: 74 },
  { code: 'elbow-right', cx: 127, cy: 74 },
  { code: 'forearm-left', cx: 72, cy: 88 },
  { code: 'forearm-right', cx: 134, cy: 88 },
  { code: 'wrist-left', cx: 71, cy: 102 },
  { code: 'wrist-right', cx: 135, cy: 102 },
  { code: 'hand-left', cx: 70, cy: 114 },
  { code: 'hand-right', cx: 136, cy: 114 },
  { code: 'thigh-left', cx: 96, cy: 132 },
  { code: 'thigh-right', cx: 110, cy: 132 },
  { code: 'knee-left', cx: 95, cy: 153 },
  { code: 'knee-right', cx: 111, cy: 153 },
  { code: 'shin-left', cx: 94, cy: 174 },
  { code: 'shin-right', cx: 112, cy: 174 },
  { code: 'ankle-left', cx: 96, cy: 190 },
  { code: 'ankle-right', cx: 110, cy: 190 },
  { code: 'foot-left', cx: 95, cy: 202 },
  { code: 'foot-right', cx: 111, cy: 202 },
];

export const BACK_DOTS: DotPosition[] = [
  { code: 'ear-left', cx: 88, cy: 15 },
  { code: 'ear-right', cx: 119, cy: 15 },
  { code: 'shoulder-left', cx: 82, cy: 42 },
  { code: 'shoulder-right', cx: 124, cy: 42 },
  { code: 'upper-back', cx: 103, cy: 58 },
  { code: 'lower-back', cx: 103, cy: 90 },
  { code: 'glute-left', cx: 97, cy: 113 },
  { code: 'glute-right', cx: 109, cy: 113 },
  { code: 'elbow-left', cx: 79, cy: 74 },
  { code: 'elbow-right', cx: 127, cy: 74 },
  { code: 'forearm-left', cx: 72, cy: 88 },
  { code: 'forearm-right', cx: 134, cy: 88 },
  { code: 'wrist-left', cx: 71, cy: 102 },
  { code: 'wrist-right', cx: 135, cy: 102 },
  { code: 'hand-left', cx: 70, cy: 114 },
  { code: 'hand-right', cx: 136, cy: 114 },
  { code: 'hamstring-left', cx: 96, cy: 132 },
  { code: 'hamstring-right', cx: 110, cy: 132 },
  { code: 'knee-left', cx: 95, cy: 153 },
  { code: 'knee-right', cx: 111, cy: 153 },
  { code: 'calf-left', cx: 94, cy: 174 },
  { code: 'calf-right', cx: 112, cy: 174 },
  { code: 'ankle-left', cx: 96, cy: 190 },
  { code: 'ankle-right', cx: 110, cy: 190 },
  { code: 'foot-left', cx: 95, cy: 202 },
  { code: 'foot-right', cx: 111, cy: 202 },
];
