import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { openDatabase, type Database } from '@med-history/core';
import { makeExpoSqliteDriver } from './expoSqliteDriver';

let dbPromise: Promise<Database> | null = null;

/** Opens the on-device DB once (runs migrations) and returns the core Database. */
export function getDatabase(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const sqlite = await SQLite.openDatabaseAsync('medhistory.db');
      const driver = makeExpoSqliteDriver(sqlite);
      return openDatabase(driver, {
        genId: () => Crypto.randomUUID(),
        now: () => new Date().toISOString(),
      });
    })();
  }
  return dbPromise;
}
