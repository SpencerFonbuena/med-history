# MedHistory — Data Model & Schema Design

> Status: approved decisions, pending spec review.
> Date: 2026-06-13

## Purpose

Define the on-device SQLite schema that powers MedHistory, plus the accessibility text/figure
sizing feature and onboarding. Grounded in the mockups under `docs/mockups/`. This is the
foundation the `packages/core` data layer will implement.

## Feature set (from the mockups)

- **Profiles** — the people whose history is tracked. Fields: `name`, `dob`, `sex`
  (`male`/`female`, which drives the body outline and avatar). Age is derived, never stored.
- **Body regions** — a fixed set of ~40 anatomical regions (`docs/mockups/app.js` `PART_LABELS`),
  e.g. `knee-right` → "Right Knee". Shared across both body outlines.
- **Body screen** — renders an SVG silhouette (the "person") with tappable dots on regions that
  have history.
- **Entries** — grouped under a (profile, region) pair, shown in tabs: **Visits**, **Notes**,
  **Prescriptions**, **Imaging & Tests**. Every entry shares `date`, `title`, `body`. Small
  type-specific extras: visit→`doctor`,`diagnosis`; prescription→`prescriber`,`duration`;
  imaging/tests→`facility` (+ document attachments). Notes have no extras.
- **Accessibility sizing** — chosen first at onboarding; one device-wide size level (5 steps,
  default = the mock) scales both text and the body figure.

## Key decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Entry storage | **One unified `entries` table** | Per-region dot counts and the merged timeline are one query; clean attachment refs; trivial to extend. |
| 2 | Imaging vs Tests | **One combined type** (`imaging_test`) with optional `subtype` | Matches the mock's combined tab; identical fields. |
| 3 | Accessibility scale | **Device-wide**, one level, scales **text + body figure** | Set once at onboarding by whoever holds the phone; simplest model. |
| 4 | Region-less entries | **Allowed** (`region_code` nullable = "General") | Covers systemic meds, vaccines, whole-body labs. |
| 5 | Device user vs medical person | Device user = app operator, represented by **device-level settings**; medical persons = `profiles`. No separate `device_users` table in v1. | One operator per phone is the realistic case; multi-operator is deferred. |

### Why the unified table still leaves room to grow

1. **New entry type** = a new `type` value. `type` is validated in the app layer (Zod), not by a
   DB constraint, so adding a type needs **no migration**.
2. **New type-specific fields** go into a **`details` JSON column** — add keys with no `ALTER TABLE`.
3. **Heavy types graduate** to a companion `*_details` table keyed by `entry_id` when they earn
   it, while `entries` stays the timeline anchor.

## Schema

IDs are app-generated UUID strings (stable across export/import and future device merges).
Timestamps are ISO-8601 text. `PRAGMA foreign_keys = ON`. Schema version tracked via
`PRAGMA user_version` with a sequential migration runner in `packages/core`.

```sql
-- Device-level settings. Exactly one row.
CREATE TABLE app_settings (
  id               INTEGER PRIMARY KEY CHECK (id = 1),
  size_level       INTEGER NOT NULL DEFAULT 1,   -- 1..5; 1 = mock default. App maps level → text + figure multipliers.
  onboarding_done  INTEGER NOT NULL DEFAULT 0,   -- boolean
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- Medical history persons.
CREATE TABLE profiles (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  dob         TEXT NOT NULL,                       -- 'YYYY-MM-DD'
  sex         TEXT NOT NULL,                        -- 'male' | 'female' (validated in app)
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Seeded reference set (~40 rows), bundled and inserted on first migration.
CREATE TABLE body_regions (
  code   TEXT PRIMARY KEY,                          -- 'knee-right'
  label  TEXT NOT NULL,                             -- 'Right Knee'
  zone   TEXT NOT NULL,                             -- grouping, e.g. 'leg' | 'head' | 'torso'
  side   TEXT                                       -- 'left' | 'right' | NULL
);

-- Unified entry timeline.
CREATE TABLE entries (
  id           TEXT PRIMARY KEY,
  profile_id   TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  region_code  TEXT REFERENCES body_regions(code),   -- NULL = "General" (systemic)
  type         TEXT NOT NULL,                          -- 'visit'|'note'|'prescription'|'imaging_test' (app-validated)
  subtype      TEXT,                                   -- imaging_test → 'imaging' | 'lab'; else NULL
  date         TEXT NOT NULL,                          -- 'YYYY-MM-DD'
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  doctor       TEXT,                                   -- visit
  diagnosis    TEXT,                                   -- visit
  prescriber   TEXT,                                   -- prescription
  duration     TEXT,                                   -- prescription
  facility     TEXT,                                   -- imaging_test
  details      TEXT,                                   -- JSON; open-ended type-specific growth
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- File metadata; bytes live on the filesystem (Expo FileSystem).
CREATE TABLE attachments (
  id                 TEXT PRIMARY KEY,
  entry_id           TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  relative_path      TEXT NOT NULL,                    -- e.g. 'attachments/{entryId}/{uuid}.jpg'
  mime_type          TEXT NOT NULL,
  original_filename  TEXT,
  size_bytes         INTEGER,
  created_at         TEXT NOT NULL
);

CREATE INDEX idx_entries_profile_region ON entries(profile_id, region_code);
CREATE INDEX idx_entries_profile_type   ON entries(profile_id, type);
CREATE INDEX idx_entries_profile_date   ON entries(profile_id, date);
CREATE INDEX idx_attachments_entry      ON attachments(entry_id);
```

## File storage (attachments)

- Bytes are written under `FileSystem.documentDirectory` at
  `attachments/{entryId}/{uuid}.{ext}`; the DB stores only the **relative** path.
- Paths are resolved against `documentDirectory` at runtime. We never store absolute paths —
  the app's sandbox absolute path can change between installs/OS updates, which would orphan
  files. (Resolution + I/O live in a repository per `mobile.md §5`.)
- Deleting an entry cascades its `attachments` rows; the repository also deletes the files.

## Accessibility sizing

- `app_settings.size_level` is an integer 1–5; **1 = the mock's current sizing**, 5 = very large.
- The app maps `size_level` → a text multiplier and a body-figure multiplier (the two curves
  differ; only the level is persisted). Text multipliers apply over the base type scale observed
  in the mock (≈11–32px).
- Onboarding shows the size selector **first**, writes `size_level`, then sets
  `onboarding_done = 1`.

### First-pass multiplier curves (to tune on device)

| level | label | textScale | figureScale |
|------:|-------|----------:|------------:|
| 1 | Default (mock) | 1.00 | 1.00 |
| 2 | Large | 1.15 | 1.08 |
| 3 | Larger | 1.35 | 1.18 |
| 4 | Extra large | 1.65 | 1.30 |
| 5 | Very large | 2.00 | 1.45 |

- Text ramps to 2× so the smallest mock text (~11–13px) reaches a comfortable ~22–26px and titles
  (~18px) reach ~36px at level 5.
- The figure ramps more gently because it is already near the screen width; its main job is
  enlarging the tappable region **dots** for low-vision / unsteady hands. When the scaled figure
  exceeds the viewport height, the body screen scrolls vertically rather than shrinking the figure.
- These live as a constant in `packages/core` (or the mobile theme), not the DB.

## Seeding & migrations

- `packages/core` owns a versioned migration runner keyed on `PRAGMA user_version`.
- Migration 1 creates the tables above and seeds `body_regions` from a bundled constant derived
  from `PART_LABELS`, plus the singleton `app_settings` row.
- `type`/`subtype`/`sex` values are validated by Zod schemas in `packages/core`, not DB CHECK
  constraints, to keep type additions migration-free.

## Forward-compatible hooks (not built now)

- **Prescriptions ↔ medication catalog**: a prescription's `details` can later carry an `rxcui`
  linking to the bundled `data/medications/` catalog for autocomplete.
- **Export/Import**: UUID PKs + relative attachment paths make a whole-profile export/import
  (the durability/portability feature) straightforward later.

## "General" bucket on the body screen

Region-less entries (`region_code IS NULL`) are reached through a dedicated **"General" control**
that is **always present** on the body screen — a labeled circle/button alongside the figure. It
mirrors the region dots' lit/unlit treatment: **lit when it holds entries, dim/unlit when empty**,
so the user can see at a glance whether anything is in there. Tapping it opens the same entry-list
UI filtered to `region_code IS NULL`.

## Resolved

- Size-level curves: first-pass table above (tunable on device).
- "General" visibility: always shown, with a lit/unlit indicator like the region dots.
