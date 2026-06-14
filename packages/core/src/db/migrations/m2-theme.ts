import type { Migration } from '../migrate';

export const m2Theme: Migration = {
  version: 2,
  up: async (d) => {
    await d.exec("ALTER TABLE app_settings ADD COLUMN theme TEXT NOT NULL DEFAULT 'dark'");
  },
};
