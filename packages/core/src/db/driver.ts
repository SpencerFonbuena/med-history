export type SqlParam = string | number | null;

/** Minimal async DB surface. Implemented by expo-sqlite (device) and better-sqlite3 (tests). */
export interface DbDriver {
  /** Run one or more statements with no params (DDL, PRAGMA). */
  exec(sql: string): Promise<void>;
  /** Run a write statement. */
  run(sql: string, params?: SqlParam[]): Promise<void>;
  /** Return the first row, or undefined. */
  get<T>(sql: string, params?: SqlParam[]): Promise<T | undefined>;
  /** Return all rows. */
  all<T>(sql: string, params?: SqlParam[]): Promise<T[]>;
  /** Run fn inside BEGIN/COMMIT; ROLLBACK on throw. */
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}
