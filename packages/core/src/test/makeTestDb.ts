import { makeBetterSqliteDriver } from './betterSqliteDriver';
import { openDatabase } from '../db/database';

/** Deterministic id/clock so assertions are stable. */
export function makeDeterministicDeps() {
  let idSeq = 0;
  let clock = 1_700_000_000_000; // fixed epoch ms
  return {
    genId: () => `id-${++idSeq}`,
    now: () => new Date(clock).toISOString(),
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

/** Fresh in-memory DB with migrations applied and repos ready. */
export async function makeTestDb() {
  const driver = makeBetterSqliteDriver(':memory:');
  const deps = makeDeterministicDeps();
  const db = await openDatabase(driver, { genId: deps.genId, now: deps.now });
  return { db, driver, deps };
}
