import { describe, it, expect } from 'vitest';
import { entryForm } from './entryForm';

describe('entryForm', () => {
  it('accepts a minimal valid entry', () => {
    expect(entryForm.safeParse({ date: '2026-01-02', title: 'Visit', body: 'Notes' }).success).toBe(true);
  });
  it('rejects an empty title', () => {
    expect(entryForm.safeParse({ date: '2026-01-02', title: '  ', body: 'Notes' }).success).toBe(false);
  });
  it('rejects a malformed date', () => {
    expect(entryForm.safeParse({ date: 'nope', title: 'Visit', body: 'Notes' }).success).toBe(false);
  });
  it('accepts an imaging subtype', () => {
    expect(entryForm.safeParse({ date: '2026-01-02', title: 'MRI', body: 'x', subtype: 'imaging' }).success).toBe(true);
  });
});
