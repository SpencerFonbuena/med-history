import { getDatabase } from '@/lib/db/database';
import type { SettingsPort } from '../services/coordinators/settings.coordinator';

/** Device-backed settings port: resolves the singleton DB then delegates to core. */
export const settingsRepository: SettingsPort = {
  async get() {
    return (await getDatabase()).settings.get();
  },
  async setSizeLevel(level) {
    return (await getDatabase()).settings.setSizeLevel(level);
  },
  async setTheme(theme) {
    return (await getDatabase()).settings.setTheme(theme);
  },
  async completeOnboarding() {
    return (await getDatabase()).settings.completeOnboarding();
  },
};
