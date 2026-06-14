// packages/core/src/schemas/schemas.test.ts
import { describe, it, expect } from 'vitest';
import { createEntryInput } from './entry.schema';
import { createProfileInput } from './profile.schema';

describe('schemas', () => {
  it('accepts a valid profile input', () => {
    const r = createProfileInput.safeParse({ name: 'Sam', dob: '1990-01-02', sex: 'female' });
    expect(r.success).toBe(true);
  });

  it('rejects a bad date and bad sex', () => {
    expect(createProfileInput.safeParse({ name: 'X', dob: '01/02/1990', sex: 'female' }).success).toBe(false);
    expect(createProfileInput.safeParse({ name: 'X', dob: '1990-01-02', sex: 'other' }).success).toBe(false);
  });

  it('only allows subtype on imaging_test entries', () => {
    const ok = createEntryInput.safeParse({ type: 'imaging_test', subtype: 'lab', date: '2026-01-01', title: 't', body: 'b' });
    const bad = createEntryInput.safeParse({ type: 'visit', subtype: 'lab', date: '2026-01-01', title: 't', body: 'b' });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});
