// packages/core/src/schemas/profile.schema.ts
import { z } from 'zod';
import { Sex, IsoDate } from './enums';

export const createProfileInput = z.object({
  name: z.string().trim().min(1),
  dob: IsoDate,
  sex: Sex,
});
export type CreateProfileInput = z.infer<typeof createProfileInput>;

export const updateProfileInput = createProfileInput.partial();
export type UpdateProfileInput = z.infer<typeof updateProfileInput>;

export interface Profile {
  id: string;
  name: string;
  dob: string;
  sex: Sex;
  createdAt: string;
  updatedAt: string;
}
