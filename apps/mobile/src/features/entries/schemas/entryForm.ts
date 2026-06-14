import { z } from 'zod';

// Type is fixed by the tab/route (not user-entered), so it is not part of this schema.
export const entryForm = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a date'),
  title: z.string().trim().min(1, 'Title is required'),
  body: z.string().trim().min(1, 'Details are required'),
  doctor: z.string().trim().optional(),
  diagnosis: z.string().trim().optional(),
  prescriber: z.string().trim().optional(),
  duration: z.string().trim().optional(),
  facility: z.string().trim().optional(),
  subtype: z.enum(['imaging', 'lab']).optional(),
});

export type EntryFormValues = z.infer<typeof entryForm>;
