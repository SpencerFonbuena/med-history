// packages/core/src/repositories/settings.repository.test.ts
import { describe, it, expect } from 'vitest';
import { makeTestDb } from '../test/makeTestDb';

describe('settings repository', () => {
  it('reads defaults then updates size level and onboarding flag', async () => {
    const { db } = await makeTestDb();
    const initial = await db.settings.get();
    expect(initial.sizeLevel).toBe(1);
    expect(initial.onboardingDone).toBe(false);

    await db.settings.setSizeLevel(4);
    await db.settings.completeOnboarding();

    const after = await db.settings.get();
    expect(after.sizeLevel).toBe(4);
    expect(after.onboardingDone).toBe(true);
  });

  it('rejects an out-of-range size level', async () => {
    const { db } = await makeTestDb();
    await expect(db.settings.setSizeLevel(9)).rejects.toThrow();
  });
});
