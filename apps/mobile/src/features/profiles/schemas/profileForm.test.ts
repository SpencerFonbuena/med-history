import { describe, it, expect } from 'vitest';
import { profileForm } from './profileForm';
import { toIsoDate } from '../utils/date';

describe('profileForm', () => {
  it('accepts a valid past-dated profile', () => {
    expect(profileForm.safeParse({ name: 'Sam', dob: '1990-01-02', sex: 'female' }).success).toBe(true);
  });
  it("accepts today's local date (guard uses local, not UTC)", () => {
    expect(profileForm.safeParse({ name: 'Sam', dob: toIsoDate(new Date()), sex: 'male' }).success).toBe(true);
  });
  it('rejects an empty name', () => {
    expect(profileForm.safeParse({ name: '  ', dob: '1990-01-02', sex: 'male' }).success).toBe(false);
  });
  it('rejects a future date of birth', () => {
    expect(profileForm.safeParse({ name: 'Sam', dob: '2999-01-01', sex: 'male' }).success).toBe(false);
  });
  it('rejects an invalid sex', () => {
    expect(profileForm.safeParse({ name: 'Sam', dob: '1990-01-02', sex: 'other' }).success).toBe(false);
  });
});
