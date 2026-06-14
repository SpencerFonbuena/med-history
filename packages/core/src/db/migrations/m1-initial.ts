import type { Migration } from '../migrate';
import { BODY_REGIONS } from '../../data/bodyRegions.seed';

const SCHEMA = `
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  size_level INTEGER NOT NULL DEFAULT 1,
  onboarding_done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dob TEXT NOT NULL,
  sex TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE body_regions (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  zone TEXT NOT NULL,
  side TEXT
);
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  region_code TEXT REFERENCES body_regions(code),
  type TEXT NOT NULL,
  subtype TEXT,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  doctor TEXT,
  diagnosis TEXT,
  prescriber TEXT,
  duration TEXT,
  facility TEXT,
  details TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  relative_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  original_filename TEXT,
  size_bytes INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_entries_profile_region ON entries(profile_id, region_code);
CREATE INDEX idx_entries_profile_type ON entries(profile_id, type);
CREATE INDEX idx_entries_profile_date ON entries(profile_id, date);
CREATE INDEX idx_attachments_entry ON attachments(entry_id);
`;

export const m1Initial: Migration = {
  version: 1,
  up: async (d) => {
    await d.exec(SCHEMA);
    // Seed the single settings row with a placeholder timestamp; real apps set it on first write.
    await d.run(
      'INSERT INTO app_settings (id, size_level, onboarding_done, created_at, updated_at) VALUES (1, 1, 0, ?, ?)',
      ['1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z'],
    );
    for (const r of BODY_REGIONS) {
      await d.run('INSERT INTO body_regions (code, label, zone, side) VALUES (?, ?, ?, ?)', [
        r.code,
        r.label,
        r.zone,
        r.side,
      ]);
    }
  },
};
