// packages/core/src/schemas/entry.schema.ts
import { z } from 'zod';
import { EntryType, ImagingSubtype, IsoDate } from './enums';

export const createEntryInput = z
  .object({
    profileId: z.string().min(1).optional(), // supplied by repo if omitted
    regionCode: z.string().min(1).nullable().optional(), // null/undefined => General
    type: EntryType,
    subtype: ImagingSubtype.nullable().optional(),
    date: IsoDate,
    title: z.string().trim().min(1),
    body: z.string().trim().min(1),
    doctor: z.string().trim().optional(),
    diagnosis: z.string().trim().optional(),
    prescriber: z.string().trim().optional(),
    duration: z.string().trim().optional(),
    facility: z.string().trim().optional(),
    details: z.record(z.unknown()).nullable().optional(),
  })
  .refine((e) => e.subtype == null || e.type === 'imaging_test', {
    message: 'subtype is only valid on imaging_test entries',
    path: ['subtype'],
  });
export type CreateEntryInput = z.infer<typeof createEntryInput>;

export const updateEntryInput = z
  .object({
    regionCode: z.string().min(1).nullable().optional(),
    subtype: ImagingSubtype.nullable().optional(),
    date: IsoDate.optional(),
    title: z.string().trim().min(1).optional(),
    body: z.string().trim().min(1).optional(),
    doctor: z.string().trim().optional(),
    diagnosis: z.string().trim().optional(),
    prescriber: z.string().trim().optional(),
    duration: z.string().trim().optional(),
    facility: z.string().trim().optional(),
    details: z.record(z.unknown()).nullable().optional(),
  });
export type UpdateEntryInput = z.infer<typeof updateEntryInput>;

export interface Entry {
  id: string;
  profileId: string;
  regionCode: string | null;
  type: z.infer<typeof EntryType>;
  subtype: z.infer<typeof ImagingSubtype> | null;
  date: string;
  title: string;
  body: string;
  doctor: string | null;
  diagnosis: string | null;
  prescriber: string | null;
  duration: string | null;
  facility: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
