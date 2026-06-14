import { describe, it, expect } from 'vitest';
import type { DbDriver, SqlParam } from './driver';

describe('DbDriver typing', () => {
  it('accepts a conforming object', () => {
    const fake: DbDriver = {
      exec: async () => {},
      run: async () => {},
      get: async () => undefined,
      all: async () => [],
      transaction: async (fn) => fn(),
    };
    const p: SqlParam = 'ok';
    expect(typeof fake.exec).toBe('function');
    expect(p).toBe('ok');
  });
});
