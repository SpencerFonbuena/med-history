import { describe, it, expect } from 'vitest';
import { ok, err, type Result } from './result';

describe('Result', () => {
  it('constructs ok and err', () => {
    const a: Result<number> = ok(5);
    const b: Result<number> = err('nope');
    expect(a).toEqual({ ok: true, data: 5 });
    expect(b).toEqual({ ok: false, error: 'nope' });
  });
});
