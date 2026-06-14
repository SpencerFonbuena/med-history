import type { DbDriver } from './driver';

export interface Migration {
  version: number;
  up(driver: DbDriver): Promise<void>;
}

/** Apply migrations whose version exceeds the DB's current user_version, in order. */
export async function migrate(driver: DbDriver, migrations: Migration[]): Promise<void> {
  const row = await driver.get<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  const pending = [...migrations].sort((a, b) => a.version - b.version).filter((m) => m.version > current);

  for (const m of pending) {
    await driver.transaction(async () => {
      await m.up(driver);
      // PRAGMA cannot be parameterized; version is a trusted integer.
      await driver.exec(`PRAGMA user_version = ${m.version}`);
    });
  }
}
