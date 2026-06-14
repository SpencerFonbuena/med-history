export { openDatabase, type Database, type CoreDeps } from './db/database';
export type { DbDriver, SqlParam } from './db/driver';

export type { Profile } from './schemas/profile.schema';
export type { Entry } from './schemas/entry.schema';
export type { Attachment } from './schemas/attachment.schema';
export type { AppSettings } from './schemas/settings.schema';
export type { BodyRegion } from './repositories/regions.repository';
export {
  createProfileInput, updateProfileInput,
  type CreateProfileInput, type UpdateProfileInput,
} from './schemas/profile.schema';
export { createEntryInput, type CreateEntryInput, updateEntryInput, type UpdateEntryInput } from './schemas/entry.schema';
export { createAttachmentInput, type CreateAttachmentInput } from './schemas/attachment.schema';
export { makeMedicationsRepository, type MedicationHit, type MedicationSeedRow } from './repositories/medications.repository';
export { buildFtsQuery } from './db/ftsQuery';
export {
  Sex, EntryType, ImagingSubtype, RegionSide, RegionZone, Theme,
} from './schemas/enums';
