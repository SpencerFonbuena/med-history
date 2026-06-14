import { z } from 'zod';
import { toIsoDate } from '../utils/date';

// Local-date 'today' so the future-date guard matches the picker, which produces
// the DOB via toIsoDate (local Y-M-D). Using UTC here would reject today's date
// for users in a positive UTC offset during their early-morning hours.
function todayIso(): string {
  return toIsoDate(new Date());
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
