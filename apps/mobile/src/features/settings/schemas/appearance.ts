import type { SizeLevel } from '@/constants/appearance';

export type Scheme = 'light' | 'dark';
export interface Appearance {
  scheme: Scheme;
  sizeLevel: SizeLevel;
}
