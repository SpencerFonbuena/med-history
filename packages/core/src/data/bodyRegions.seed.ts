// packages/core/src/data/bodyRegions.seed.ts
import type { RegionSide, RegionZone } from '../schemas/enums';

export interface BodyRegionSeed {
  code: string;
  label: string;
  zone: RegionZone;
  side: RegionSide | null;
}

// Human labels from docs/mockups/app.js PART_LABELS.
const LABELS: Record<string, string> = {
  'eye-left': 'Left Eye', 'eye-right': 'Right Eye', nose: 'Nose', mouth: 'Mouth',
  'ear-left': 'Left Ear', 'ear-right': 'Right Ear',
  'shoulder-left': 'Left Shoulder', 'shoulder-right': 'Right Shoulder',
  'elbow-left': 'Left Elbow', 'elbow-right': 'Right Elbow',
  'forearm-left': 'Left Forearm', 'forearm-right': 'Right Forearm',
  'wrist-left': 'Left Wrist', 'wrist-right': 'Right Wrist',
  'hand-left': 'Left Hand', 'hand-right': 'Right Hand',
  chest: 'Chest', ribs: 'Ribs', stomach: 'Stomach', pelvis: 'Pelvis',
  'hip-left': 'Left Hip', 'hip-right': 'Right Hip',
  'thigh-left': 'Left Thigh', 'thigh-right': 'Right Thigh',
  'knee-left': 'Left Knee', 'knee-right': 'Right Knee',
  'shin-left': 'Left Shin', 'shin-right': 'Right Shin',
  'ankle-left': 'Left Ankle', 'ankle-right': 'Right Ankle',
  'foot-left': 'Left Foot', 'foot-right': 'Right Foot',
  'upper-back': 'Upper Back', 'lower-back': 'Lower Back',
  'glute-left': 'Left Glute', 'glute-right': 'Right Glute',
  'hamstring-left': 'Left Hamstring', 'hamstring-right': 'Right Hamstring',
  'calf-left': 'Left Calf', 'calf-right': 'Right Calf',
};

// Base name (code without -left/-right) → zone.
const ZONE_BY_BASE: Record<string, RegionZone> = {
  eye: 'head', nose: 'head', mouth: 'head', ear: 'head',
  shoulder: 'arm', elbow: 'arm', forearm: 'arm', wrist: 'arm', hand: 'arm',
  chest: 'torso', ribs: 'torso', stomach: 'torso', pelvis: 'torso',
  'upper-back': 'torso', 'lower-back': 'torso',
  hip: 'leg', thigh: 'leg', knee: 'leg', shin: 'leg', ankle: 'leg', foot: 'leg',
  glute: 'leg', hamstring: 'leg', calf: 'leg',
};

function sideOf(code: string): RegionSide | null {
  if (code.endsWith('-left')) return 'left';
  if (code.endsWith('-right')) return 'right';
  return null;
}

function baseOf(code: string): string {
  return code.replace(/-(left|right)$/, '');
}

export const BODY_REGIONS: BodyRegionSeed[] = Object.entries(LABELS).map(([code, label]) => {
  const zone = ZONE_BY_BASE[baseOf(code)];
  if (!zone) throw new Error(`no zone mapped for region ${code}`);
  return { code, label, zone, side: sideOf(code) };
});
