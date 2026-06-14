import type { DbDriver } from '../db/driver';
import type { CoreDeps } from '../db/database';
import { SizeLevel, type AppSettings } from '../schemas/settings.schema';
import { Theme } from '../schemas/enums';

interface SettingsRow {
  size_level: number;
  theme: string;
  onboarding_done: number;
  created_at: string;
  updated_at: string;
}

export function makeSettingsRepository(driver: DbDriver, deps: CoreDeps) {
  async function get(): Promise<AppSettings> {
    const row = await driver.get<SettingsRow>('SELECT * FROM app_settings WHERE id = 1');
    if (!row) throw new Error('app_settings row missing');
    return {
      sizeLevel: row.size_level,
      theme: Theme.parse(row.theme),
      onboardingDone: row.onboarding_done === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async function setSizeLevel(level: number): Promise<void> {
    const valid = SizeLevel.parse(level);
    await driver.run('UPDATE app_settings SET size_level = ?, updated_at = ? WHERE id = 1', [valid, deps.now()]);
  }

  async function setTheme(theme: Theme): Promise<void> {
    const valid = Theme.parse(theme);
    await driver.run('UPDATE app_settings SET theme = ?, updated_at = ? WHERE id = 1', [valid, deps.now()]);
  }

  async function completeOnboarding(): Promise<void> {
    await driver.run('UPDATE app_settings SET onboarding_done = 1, updated_at = ? WHERE id = 1', [deps.now()]);
  }

  return { get, setSizeLevel, setTheme, completeOnboarding };
}
