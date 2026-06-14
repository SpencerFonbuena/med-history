import type { AppSettings, Theme } from '@med-history/core';
import type { SizeLevel } from '@/constants/appearance';
import { ok, err, type Result } from '@/lib/result';

/** The slice of core's settings repository this coordinator drives. */
export interface SettingsPort {
  get(): Promise<AppSettings>;
  setSizeLevel(level: number): Promise<void>;
  setTheme(theme: Theme): Promise<void>;
  completeOnboarding(): Promise<void>;
}

export function makeSettingsCoordinator(port: SettingsPort) {
  async function load(): Promise<Result<AppSettings>> {
    try {
      return ok(await port.get());
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function commitOnboarding(input: { sizeLevel: SizeLevel; theme: Theme }): Promise<Result<AppSettings>> {
    try {
      await port.setSizeLevel(input.sizeLevel);
      await port.setTheme(input.theme);
      await port.completeOnboarding();
      return ok(await port.get());
    } catch (e) {
      return err((e as Error).message);
    }
  }

  return { load, commitOnboarding };
}
