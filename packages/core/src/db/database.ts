import type { DbDriver } from './driver';
import { migrate } from './migrate';
import { migrations } from './migrations/index';
import { makeSettingsRepository } from '../repositories/settings.repository';
import { makeProfilesRepository } from '../repositories/profiles.repository';
import { makeRegionsRepository } from '../repositories/regions.repository';
import { makeEntriesRepository } from '../repositories/entries.repository';
import { makeAttachmentsRepository } from '../repositories/attachments.repository';
import { makeMedicationsRepository } from '../repositories/medications.repository';

export interface CoreDeps {
  /** Returns a new unique id (e.g. a UUID). */
  genId: () => string;
  /** Returns the current time as an ISO-8601 string. */
  now: () => string;
}

export interface Database {
  settings: ReturnType<typeof makeSettingsRepository>;
  profiles: ReturnType<typeof makeProfilesRepository>;
  regions: ReturnType<typeof makeRegionsRepository>;
  entries: ReturnType<typeof makeEntriesRepository>;
  attachments: ReturnType<typeof makeAttachmentsRepository>;
  medications: ReturnType<typeof makeMedicationsRepository>;
}

/** Apply migrations, then build the repository surface over the driver. */
export async function openDatabase(driver: DbDriver, deps: CoreDeps): Promise<Database> {
  await driver.exec('PRAGMA foreign_keys = ON');
  await migrate(driver, migrations);
  return {
    settings: makeSettingsRepository(driver, deps),
    profiles: makeProfilesRepository(driver, deps),
    regions: makeRegionsRepository(driver),
    entries: makeEntriesRepository(driver, deps),
    attachments: makeAttachmentsRepository(driver, deps),
    medications: makeMedicationsRepository(driver),
  };
}
