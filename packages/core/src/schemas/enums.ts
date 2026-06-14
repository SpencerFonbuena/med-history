// packages/core/src/schemas/enums.ts
import { z } from 'zod';

export const Sex = z.enum(['male', 'female']);
export type Sex = z.infer<typeof Sex>;

export const EntryType = z.enum(['visit', 'note', 'prescription', 'imaging_test']);
export type EntryType = z.infer<typeof EntryType>;

export const ImagingSubtype = z.enum(['imaging', 'lab']);
export type ImagingSubtype = z.infer<typeof ImagingSubtype>;

export const RegionSide = z.enum(['left', 'right']);
export type RegionSide = z.infer<typeof RegionSide>;

export const RegionZone = z.enum(['head', 'torso', 'arm', 'leg']);
export type RegionZone = z.infer<typeof RegionZone>;

/** ISO calendar date 'YYYY-MM-DD'. */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
