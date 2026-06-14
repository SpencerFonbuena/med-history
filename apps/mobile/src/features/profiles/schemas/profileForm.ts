import { z } from 'zod';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Sex values mirror core's Sex enum ('male' | 'female'); declared locally so this
// pure schema/test has no cross-package runtime import.
export const profileForm = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a date of birth'),
    sex: z.enum(['male', 'female']),
  })
  .refine((v) => v.dob <= todayIso(), {
    message: 'Date of birth cannot be in the future',
    path: ['dob'],
  });

export type ProfileFormValues = z.infer<typeof profileForm>;
