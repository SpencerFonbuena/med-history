import { describe, it, expect } from 'vitest';
import { makeTestDb } from '../test/makeTestDb';

describe('openDatabase', () => {
  it('runs migrations and exposes repositories', async () => {
    const { db } = await makeTestDb();
    expect(typeof db.profiles.create).toBe('function');
    expect(typeof db.settings.get).toBe('function');
    expect(typeof db.entries.create).toBe('function');
    expect(typeof db.regions.list).toBe('function');
    expect(typeof db.attachments.create).toBe('function');
  });
});
