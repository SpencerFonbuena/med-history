// packages/core/src/schemas/settings.schema.ts
import { z } from 'zod';

export const SizeLevel = z.number().int().min(1).max(5);

export interface AppSettings {
  sizeLevel: number;
  onboardingDone: boolean;
  createdAt: string;
  updatedAt: string;
}
