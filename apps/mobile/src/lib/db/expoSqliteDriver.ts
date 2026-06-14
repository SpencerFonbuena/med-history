import type { SQLiteDatabase } from 'expo-sqlite';
import type { DbDriver, SqlParam } from '@med-history/core';

/** Adapts expo-sqlite's async API to core's DbDriver. */
export function makeExpoSqliteDriver(db: SQLiteDatabase): DbDriver {
  return {
    async exec(sql: string) {
      await db.execAsync(sql);
    },
    async run(sql: string, params: SqlParam[] = []) {
      await db.runAsync(sql, params);
    },
    async get<T>(sql: string, params: SqlParam[] = []) {
      return ((await db.getFirstAsync<T>(sql, params)) ?? undefined) as T | undefined;
    },
    async all<T>(sql: string, params: SqlParam[] = []) {
      return (await db.getAllAsync<T>(sql, params)) as T[];
    },
    async transaction<T>(fn: () => Promise<T>) {
      let result!: T;
      await db.withTransactionAsync(async () => {
        result = await fn();
      });
      return result;
    },
  };
}
