// packages/core/src/schemas/settings.schema.ts
import { z } from 'zod';
import type { Theme } from './enums';

export const SizeLevel = z.number().int().min(1).max(5);

export interface AppSettings {
  sizeLevel: number;
  theme: Theme;
  onboardingDone: boolean;
  createdAt: string;
  updatedAt: string;
}
