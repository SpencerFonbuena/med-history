import { describe, it, expect } from 'vitest';
import { makeSettingsCoordinator, type SettingsPort } from './settings.coordinator';
import type { AppSettings } from '@med-history/core';

function fakePort(over: Partial<SettingsPort> = {}): SettingsPort {
  const state: AppSettings = { sizeLevel: 1, theme: 'dark', onboardingDone: false, createdAt: 't', updatedAt: 't' };
  return {
    get: async () => state,
    setSizeLevel: async (l) => { state.sizeLevel = l; },
    setTheme: async (t) => { state.theme = t; },
    completeOnboarding: async () => { state.onboardingDone = true; },
    ...over,
  };
}

describe('settings coordinator', () => {
  it('returns ok on get', async () => {
    const c = makeSettingsCoordinator(fakePort());
    const r = await c.load();
    expect(r.ok && r.data.theme).toBe('dark');
  });

  it('wraps thrown errors as err', async () => {
    const c = makeSettingsCoordinator(fakePort({ get: async () => { throw new Error('db down'); } }));
    const r = await c.load();
    expect(r.ok).toBe(false);
  });

  it('commits onboarding in one call (size + theme + complete)', async () => {
    const port = fakePort();
    const c = makeSettingsCoordinator(port);
    const r = await c.commitOnboarding({ sizeLevel: 4, theme: 'light' });
    expect(r.ok).toBe(true);
    expect((await port.get()).onboardingDone).toBe(true);
    expect((await port.get()).sizeLevel).toBe(4);
    expect((await port.get()).theme).toBe('light');
  });
});
