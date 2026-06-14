import Database from 'better-sqlite3';
import type { DbDriver, SqlParam } from '../db/driver';

/** A synchronous better-sqlite3 connection wrapped to satisfy the async DbDriver. */
export function makeBetterSqliteDriver(path = ':memory:'): DbDriver {
  const db = new Database(path);
  db.pragma('foreign_keys = ON');
  return {
    async exec(sql) {
      db.exec(sql);
    },
    async run(sql, params: SqlParam[] = []) {
      db.prepare(sql).run(...params);
    },
    async get<T>(sql: string, params: SqlParam[] = []) {
      return db.prepare(sql).get(...params) as T | undefined;
    },
    async all<T>(sql: string, params: SqlParam[] = []) {
      return db.prepare(sql).all(...params) as T[];
    },
    async transaction<T>(fn: () => Promise<T>) {
      db.exec('BEGIN');
      try {
        const result = await fn();
        db.exec('COMMIT');
        return result;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
  };
}
