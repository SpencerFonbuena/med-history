# Core Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `packages/core` — the framework-agnostic SQLite data layer (schema, migrations, seed, validated repositories) that powers MedHistory, fully unit-tested in plain Node.

**Architecture:** Core depends only on `zod`. All DB access goes through an injected async `DbDriver` interface, so the same repositories run against `expo-sqlite` on device (adapter lives in `apps/mobile`, built in the UI plan) and against `better-sqlite3` in tests. IDs and timestamps are injected (`genId`, `now`) so tests are deterministic. Booleans store as 0/1; dates/timestamps as ISO-8601 text; `entries.details` as JSON text.

**Tech Stack:** TypeScript, zod, vitest, better-sqlite3 (test driver only). Source spec: `docs/specs/2026-06-13-data-model-design.md`.

---

## File structure

```
packages/core/
  package.json                         # name @med-history/core, deps: zod; dev: vitest, better-sqlite3
  tsconfig.json                        # extends ../../tsconfig.base.json
  vitest.config.ts
  src/
    index.ts                           # public barrel
    db/
      driver.ts                        # DbDriver interface + SqlParam
      database.ts                      # openDatabase(driver, deps) → runs migrations, returns repos
      migrate.ts                       # migration runner (PRAGMA user_version)
      migrations/
        index.ts                       # ordered migration list
        m1-initial.ts                  # schema DDL + seed app_settings + body_regions
    schemas/
      enums.ts                         # Sex, EntryType, ImagingSubtype, RegionSide, RegionZone
      profile.schema.ts
      entry.schema.ts
      attachment.schema.ts
      settings.schema.ts
    data/
      bodyRegions.seed.ts              # ~40 regions derived from the mock's PART_LABELS
    repositories/
      settings.repository.ts
      profiles.repository.ts
      regions.repository.ts
      entries.repository.ts
      attachments.repository.ts
    test/
      betterSqliteDriver.ts            # async DbDriver over better-sqlite3 (test support)
      makeTestDb.ts                    # helper: in-memory db + deterministic deps
```

---

### Task 1: Package tooling + test harness

**Files:**
- Modify: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/src/index.ts`
- Test: `packages/core/src/smoke.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/smoke.test.ts
import { describe, it, expect } from 'vitest';
import { CORE_READY } from './index';

describe('core package', () => {
  it('loads', () => {
    expect(CORE_READY).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test`
Expected: FAIL — `Cannot find module './index'` (or `CORE_READY` undefined).

- [ ] **Step 3: Write minimal implementation + config**

```ts
// packages/core/src/index.ts
export const CORE_READY = true;
```

```jsonc
// packages/core/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
```

```ts
// packages/core/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```

Replace `packages/core/package.json` with:

```json
{
  "name": "@med-history/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.11",
    "@types/node": "^22.0.0",
    "better-sqlite3": "^11.3.0",
    "vitest": "^2.1.0"
  }
}
```

Then install: `pnpm install` (from repo root).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "chore(core): set up package tooling and vitest harness"
```

---

### Task 2: DbDriver interface

**Files:**
- Create: `packages/core/src/db/driver.ts`
- Test: `packages/core/src/db/driver.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/db/driver.test.ts
import { describe, it, expect } from 'vitest';
import type { DbDriver, SqlParam } from './driver';

describe('DbDriver typing', () => {
  it('accepts a conforming object', () => {
    const fake: DbDriver = {
      exec: async () => {},
      run: async () => {},
      get: async () => undefined,
      all: async () => [],
      transaction: async (fn) => fn(),
    };
    const p: SqlParam = 'ok';
    expect(typeof fake.exec).toBe('function');
    expect(p).toBe('ok');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/db/driver.test.ts`
Expected: FAIL — `Cannot find module './driver'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/db/driver.ts
export type SqlParam = string | number | null;

/** Minimal async DB surface. Implemented by expo-sqlite (device) and better-sqlite3 (tests). */
export interface DbDriver {
  /** Run one or more statements with no params (DDL, PRAGMA). */
  exec(sql: string): Promise<void>;
  /** Run a write statement. */
  run(sql: string, params?: SqlParam[]): Promise<void>;
  /** Return the first row, or undefined. */
  get<T>(sql: string, params?: SqlParam[]): Promise<T | undefined>;
  /** Return all rows. */
  all<T>(sql: string, params?: SqlParam[]): Promise<T[]>;
  /** Run fn inside BEGIN/COMMIT; ROLLBACK on throw. */
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/db/driver.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/db/driver.ts packages/core/src/db/driver.test.ts
git commit -m "feat(core): add DbDriver interface"
```

---

### Task 3: better-sqlite3 test driver + test db helper

**Files:**
- Create: `packages/core/src/test/betterSqliteDriver.ts`
- Create: `packages/core/src/test/makeTestDb.ts`
- Test: `packages/core/src/test/betterSqliteDriver.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/test/betterSqliteDriver.test.ts
import { describe, it, expect } from 'vitest';
import { makeBetterSqliteDriver } from './betterSqliteDriver';

describe('betterSqliteDriver', () => {
  it('runs, reads, and rolls back transactions', async () => {
    const db = makeBetterSqliteDriver(':memory:');
    await db.exec('CREATE TABLE t (id TEXT PRIMARY KEY, n INTEGER)');
    await db.run('INSERT INTO t (id, n) VALUES (?, ?)', ['a', 1]);

    const row = await db.get<{ id: string; n: number }>('SELECT * FROM t WHERE id = ?', ['a']);
    expect(row?.n).toBe(1);

    await expect(
      db.transaction(async () => {
        await db.run('INSERT INTO t (id, n) VALUES (?, ?)', ['b', 2]);
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    const all = await db.all<{ id: string }>('SELECT id FROM t');
    expect(all.map((r) => r.id)).toEqual(['a']); // 'b' rolled back
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/test/betterSqliteDriver.test.ts`
Expected: FAIL — `Cannot find module './betterSqliteDriver'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/test/betterSqliteDriver.ts
import Database from 'better-sqlite3';
import type { DbDriver, SqlParam } from '../db/driver';

/** A synchronous better-sqlite3 connection wrapped to satisfy the async DbDriver. */
export function makeBetterSqliteDriver(path = ':memory:'): DbDriver {
  const db = new Database(path);
  db.pragma('foreign_keys = ON');
  return {
    async exec(sql) {
      db.exec(sql);
    },
    async run(sql, params: SqlParam[] = []) {
      db.prepare(sql).run(...params);
    },
    async get<T>(sql: string, params: SqlParam[] = []) {
      return db.prepare(sql).get(...params) as T | undefined;
    },
    async all<T>(sql: string, params: SqlParam[] = []) {
      return db.prepare(sql).all(...params) as T[];
    },
    async transaction<T>(fn: () => Promise<T>) {
      db.exec('BEGIN');
      try {
        const result = await fn();
        db.exec('COMMIT');
        return result;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
  };
}
```

```ts
// packages/core/src/test/makeTestDb.ts
import { makeBetterSqliteDriver } from './betterSqliteDriver';
import { openDatabase } from '../db/database';

/** Deterministic id/clock so assertions are stable. */
export function makeDeterministicDeps() {
  let idSeq = 0;
  let clock = 1_700_000_000_000; // fixed epoch ms
  return {
    genId: () => `id-${++idSeq}`,
    now: () => new Date(clock).toISOString(),
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

/** Fresh in-memory DB with migrations applied and repos ready. */
export async function makeTestDb() {
  const driver = makeBetterSqliteDriver(':memory:');
  const deps = makeDeterministicDeps();
  const db = await openDatabase(driver, { genId: deps.genId, now: deps.now });
  return { db, driver, deps };
}
```

> `makeTestDb` imports `openDatabase` (Task 8). Until then, run only `betterSqliteDriver.test.ts` (the helper file compiles lazily; its test does not import `makeTestDb`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/test/betterSqliteDriver.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/test/betterSqliteDriver.ts packages/core/src/test/makeTestDb.ts packages/core/src/test/betterSqliteDriver.test.ts
git commit -m "test(core): add better-sqlite3 driver and test db helper"
```

---

### Task 4: Enums + Zod schemas

**Files:**
- Create: `packages/core/src/schemas/enums.ts`
- Create: `packages/core/src/schemas/profile.schema.ts`
- Create: `packages/core/src/schemas/entry.schema.ts`
- Create: `packages/core/src/schemas/attachment.schema.ts`
- Create: `packages/core/src/schemas/settings.schema.ts`
- Test: `packages/core/src/schemas/schemas.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/schemas/schemas.test.ts
import { describe, it, expect } from 'vitest';
import { createEntryInput } from './entry.schema';
import { createProfileInput } from './profile.schema';

describe('schemas', () => {
  it('accepts a valid profile input', () => {
    const r = createProfileInput.safeParse({ name: 'Sam', dob: '1990-01-02', sex: 'female' });
    expect(r.success).toBe(true);
  });

  it('rejects a bad date and bad sex', () => {
    expect(createProfileInput.safeParse({ name: 'X', dob: '01/02/1990', sex: 'female' }).success).toBe(false);
    expect(createProfileInput.safeParse({ name: 'X', dob: '1990-01-02', sex: 'other' }).success).toBe(false);
  });

  it('only allows subtype on imaging_test entries', () => {
    const ok = createEntryInput.safeParse({ type: 'imaging_test', subtype: 'lab', date: '2026-01-01', title: 't', body: 'b' });
    const bad = createEntryInput.safeParse({ type: 'visit', subtype: 'lab', date: '2026-01-01', title: 't', body: 'b' });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/schemas/schemas.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/schemas/enums.ts
import { z } from 'zod';

export const Sex = z.enum(['male', 'female']);
export type Sex = z.infer<typeof Sex>;

export const EntryType = z.enum(['visit', 'note', 'prescription', 'imaging_test']);
export type EntryType = z.infer<typeof EntryType>;

export const ImagingSubtype = z.enum(['imaging', 'lab']);
export type ImagingSubtype = z.infer<typeof ImagingSubtype>;

export const RegionSide = z.enum(['left', 'right']);
export type RegionSide = z.infer<typeof RegionSide>;

export const RegionZone = z.enum(['head', 'torso', 'arm', 'leg']);
export type RegionZone = z.infer<typeof RegionZone>;

/** ISO calendar date 'YYYY-MM-DD'. */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
```

```ts
// packages/core/src/schemas/profile.schema.ts
import { z } from 'zod';
import { Sex, IsoDate } from './enums';

export const createProfileInput = z.object({
  name: z.string().trim().min(1),
  dob: IsoDate,
  sex: Sex,
});
export type CreateProfileInput = z.infer<typeof createProfileInput>;

export const updateProfileInput = createProfileInput.partial();
export type UpdateProfileInput = z.infer<typeof updateProfileInput>;

export interface Profile {
  id: string;
  name: string;
  dob: string;
  sex: Sex;
  createdAt: string;
  updatedAt: string;
}
```

```ts
// packages/core/src/schemas/entry.schema.ts
import { z } from 'zod';
import { EntryType, ImagingSubtype, IsoDate } from './enums';

export const createEntryInput = z
  .object({
    profileId: z.string().min(1).optional(), // supplied by repo if omitted
    regionCode: z.string().min(1).nullable().optional(), // null/undefined => General
    type: EntryType,
    subtype: ImagingSubtype.nullable().optional(),
    date: IsoDate,
    title: z.string().trim().min(1),
    body: z.string().trim().min(1),
    doctor: z.string().trim().optional(),
    diagnosis: z.string().trim().optional(),
    prescriber: z.string().trim().optional(),
    duration: z.string().trim().optional(),
    facility: z.string().trim().optional(),
    details: z.record(z.unknown()).nullable().optional(),
  })
  .refine((e) => e.subtype == null || e.type === 'imaging_test', {
    message: 'subtype is only valid on imaging_test entries',
    path: ['subtype'],
  });
export type CreateEntryInput = z.infer<typeof createEntryInput>;

export const updateEntryInput = z
  .object({
    regionCode: z.string().min(1).nullable().optional(),
    subtype: ImagingSubtype.nullable().optional(),
    date: IsoDate.optional(),
    title: z.string().trim().min(1).optional(),
    body: z.string().trim().min(1).optional(),
    doctor: z.string().trim().optional(),
    diagnosis: z.string().trim().optional(),
    prescriber: z.string().trim().optional(),
    duration: z.string().trim().optional(),
    facility: z.string().trim().optional(),
    details: z.record(z.unknown()).nullable().optional(),
  });
export type UpdateEntryInput = z.infer<typeof updateEntryInput>;

export interface Entry {
  id: string;
  profileId: string;
  regionCode: string | null;
  type: z.infer<typeof EntryType>;
  subtype: z.infer<typeof ImagingSubtype> | null;
  date: string;
  title: string;
  body: string;
  doctor: string | null;
  diagnosis: string | null;
  prescriber: string | null;
  duration: string | null;
  facility: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
```

```ts
// packages/core/src/schemas/attachment.schema.ts
import { z } from 'zod';

export const createAttachmentInput = z.object({
  entryId: z.string().min(1),
  relativePath: z.string().min(1),
  mimeType: z.string().min(1),
  originalFilename: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
});
export type CreateAttachmentInput = z.infer<typeof createAttachmentInput>;

export interface Attachment {
  id: string;
  entryId: string;
  relativePath: string;
  mimeType: string;
  originalFilename: string | null;
  sizeBytes: number | null;
  createdAt: string;
}
```

```ts
// packages/core/src/schemas/settings.schema.ts
import { z } from 'zod';

export const SizeLevel = z.number().int().min(1).max(5);

export interface AppSettings {
  sizeLevel: number;
  onboardingDone: boolean;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/schemas/schemas.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/schemas
git commit -m "feat(core): add enums and zod schemas"
```

---

### Task 5: Body regions seed data

**Files:**
- Create: `packages/core/src/data/bodyRegions.seed.ts`
- Test: `packages/core/src/data/bodyRegions.seed.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/data/bodyRegions.seed.test.ts
import { describe, it, expect } from 'vitest';
import { BODY_REGIONS } from './bodyRegions.seed';

describe('BODY_REGIONS', () => {
  it('has the expected count and unique codes', () => {
    expect(BODY_REGIONS.length).toBe(40);
    expect(new Set(BODY_REGIONS.map((r) => r.code)).size).toBe(40);
  });

  it('parses side from the code suffix', () => {
    const knee = BODY_REGIONS.find((r) => r.code === 'knee-right')!;
    expect(knee.label).toBe('Right Knee');
    expect(knee.side).toBe('right');
    expect(knee.zone).toBe('leg');

    const nose = BODY_REGIONS.find((r) => r.code === 'nose')!;
    expect(nose.side).toBeNull();
    expect(nose.zone).toBe('head');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/data/bodyRegions.seed.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/data/bodyRegions.seed.ts
import type { RegionSide, RegionZone } from '../schemas/enums';

export interface BodyRegionSeed {
  code: string;
  label: string;
  zone: RegionZone;
  side: RegionSide | null;
}

// Human labels from docs/mockups/app.js PART_LABELS.
const LABELS: Record<string, string> = {
  'eye-left': 'Left Eye', 'eye-right': 'Right Eye', nose: 'Nose', mouth: 'Mouth',
  'ear-left': 'Left Ear', 'ear-right': 'Right Ear',
  'shoulder-left': 'Left Shoulder', 'shoulder-right': 'Right Shoulder',
  'elbow-left': 'Left Elbow', 'elbow-right': 'Right Elbow',
  'forearm-left': 'Left Forearm', 'forearm-right': 'Right Forearm',
  'wrist-left': 'Left Wrist', 'wrist-right': 'Right Wrist',
  'hand-left': 'Left Hand', 'hand-right': 'Right Hand',
  chest: 'Chest', ribs: 'Ribs', stomach: 'Stomach', pelvis: 'Pelvis',
  'hip-left': 'Left Hip', 'hip-right': 'Right Hip',
  'thigh-left': 'Left Thigh', 'thigh-right': 'Right Thigh',
  'knee-left': 'Left Knee', 'knee-right': 'Right Knee',
  'shin-left': 'Left Shin', 'shin-right': 'Right Shin',
  'ankle-left': 'Left Ankle', 'ankle-right': 'Right Ankle',
  'foot-left': 'Left Foot', 'foot-right': 'Right Foot',
  'upper-back': 'Upper Back', 'lower-back': 'Lower Back',
  'glute-left': 'Left Glute', 'glute-right': 'Right Glute',
  'hamstring-left': 'Left Hamstring', 'hamstring-right': 'Right Hamstring',
  'calf-left': 'Left Calf', 'calf-right': 'Right Calf',
};

// Base name (code without -left/-right) → zone.
const ZONE_BY_BASE: Record<string, RegionZone> = {
  eye: 'head', nose: 'head', mouth: 'head', ear: 'head',
  shoulder: 'arm', elbow: 'arm', forearm: 'arm', wrist: 'arm', hand: 'arm',
  chest: 'torso', ribs: 'torso', stomach: 'torso', pelvis: 'torso',
  'upper-back': 'torso', 'lower-back': 'torso',
  hip: 'leg', thigh: 'leg', knee: 'leg', shin: 'leg', ankle: 'leg', foot: 'leg',
  glute: 'leg', hamstring: 'leg', calf: 'leg',
};

function sideOf(code: string): RegionSide | null {
  if (code.endsWith('-left')) return 'left';
  if (code.endsWith('-right')) return 'right';
  return null;
}

function baseOf(code: string): string {
  return code.replace(/-(left|right)$/, '');
}

export const BODY_REGIONS: BodyRegionSeed[] = Object.entries(LABELS).map(([code, label]) => {
  const zone = ZONE_BY_BASE[baseOf(code)];
  if (!zone) throw new Error(`no zone mapped for region ${code}`);
  return { code, label, zone, side: sideOf(code) };
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/data/bodyRegions.seed.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/data
git commit -m "feat(core): add body regions seed derived from mock labels"
```

---

### Task 6: Migration runner

**Files:**
- Create: `packages/core/src/db/migrate.ts`
- Test: `packages/core/src/db/migrate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/db/migrate.test.ts
import { describe, it, expect } from 'vitest';
import { makeBetterSqliteDriver } from '../test/betterSqliteDriver';
import { migrate, type Migration } from './migrate';

const migrations: Migration[] = [
  { version: 1, up: async (d) => d.exec('CREATE TABLE a (id TEXT)') },
  { version: 2, up: async (d) => d.exec('CREATE TABLE b (id TEXT)') },
];

describe('migrate', () => {
  it('applies pending migrations and records user_version', async () => {
    const d = makeBetterSqliteDriver(':memory:');
    await migrate(d, migrations);

    const v = await d.get<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(2);
    // both tables exist
    const names = (await d.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'")).map((r) => r.name);
    expect(names).toContain('a');
    expect(names).toContain('b');
  });

  it('is idempotent — second run applies nothing', async () => {
    const d = makeBetterSqliteDriver(':memory:');
    await migrate(d, migrations);
    await migrate(d, migrations); // must not throw "table already exists"
    const v = await d.get<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/db/migrate.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/db/migrate.ts
import type { DbDriver } from './driver';

export interface Migration {
  version: number;
  up(driver: DbDriver): Promise<void>;
}

/** Apply migrations whose version exceeds the DB's current user_version, in order. */
export async function migrate(driver: DbDriver, migrations: Migration[]): Promise<void> {
  const row = await driver.get<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  const pending = [...migrations].sort((a, b) => a.version - b.version).filter((m) => m.version > current);

  for (const m of pending) {
    await driver.transaction(async () => {
      await m.up(driver);
      // PRAGMA cannot be parameterized; version is a trusted integer.
      await driver.exec(`PRAGMA user_version = ${m.version}`);
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/db/migrate.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/db/migrate.ts packages/core/src/db/migrate.test.ts
git commit -m "feat(core): add user_version migration runner"
```

---

### Task 7: Migration 1 — schema + seed

**Files:**
- Create: `packages/core/src/db/migrations/m1-initial.ts`
- Create: `packages/core/src/db/migrations/index.ts`
- Test: `packages/core/src/db/migrations/m1-initial.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/db/migrations/m1-initial.test.ts
import { describe, it, expect } from 'vitest';
import { makeBetterSqliteDriver } from '../../test/betterSqliteDriver';
import { migrate } from '../migrate';
import { migrations } from './index';

describe('migration 1', () => {
  it('creates tables, seeds 40 regions, and one settings row', async () => {
    const d = makeBetterSqliteDriver(':memory:');
    await migrate(d, migrations);

    const tables = (await d.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'")).map((r) => r.name);
    for (const t of ['app_settings', 'profiles', 'body_regions', 'entries', 'attachments']) {
      expect(tables).toContain(t);
    }

    const regions = await d.get<{ c: number }>('SELECT COUNT(*) AS c FROM body_regions');
    expect(regions?.c).toBe(40);

    const settings = await d.get<{ c: number; size_level: number }>('SELECT COUNT(*) AS c, size_level FROM app_settings');
    expect(settings?.c).toBe(1);
    expect(settings?.size_level).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/db/migrations/m1-initial.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/db/migrations/m1-initial.ts
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
```

```ts
// packages/core/src/db/migrations/index.ts
import type { Migration } from '../migrate';
import { m1Initial } from './m1-initial';

export const migrations: Migration[] = [m1Initial];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/db/migrations/m1-initial.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/db/migrations
git commit -m "feat(core): add initial schema migration with region + settings seed"
```

---

### Task 8: openDatabase wiring

**Files:**
- Create: `packages/core/src/db/database.ts`
- Test: `packages/core/src/db/database.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/db/database.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/db/database.test.ts`
Expected: FAIL — `openDatabase` not found / repos undefined.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/db/database.ts
import type { DbDriver } from './driver';
import { migrate } from './migrate';
import { migrations } from './migrations/index';
import { makeSettingsRepository } from '../repositories/settings.repository';
import { makeProfilesRepository } from '../repositories/profiles.repository';
import { makeRegionsRepository } from '../repositories/regions.repository';
import { makeEntriesRepository } from '../repositories/entries.repository';
import { makeAttachmentsRepository } from '../repositories/attachments.repository';

export interface CoreDeps {
  /** Returns a new unique id (e.g. a UUID). */
  genId: () => string;
  /** Returns the current time as an ISO-8601 string. */
  now: () => string;
}

export interface Database {
  settings: ReturnType<typeof makeSettingsRepository>;
  profiles: ReturnType<typeof makeProfilesRepository>;
  regions: ReturnType<typeof makeRegionsRepository>;
  entries: ReturnType<typeof makeEntriesRepository>;
  attachments: ReturnType<typeof makeAttachmentsRepository>;
}

/** Apply migrations, then build the repository surface over the driver. */
export async function openDatabase(driver: DbDriver, deps: CoreDeps): Promise<Database> {
  await driver.exec('PRAGMA foreign_keys = ON');
  await migrate(driver, migrations);
  return {
    settings: makeSettingsRepository(driver, deps),
    profiles: makeProfilesRepository(driver, deps),
    regions: makeRegionsRepository(driver),
    entries: makeEntriesRepository(driver, deps),
    attachments: makeAttachmentsRepository(driver, deps),
  };
}
```

> This file imports the five repositories (Tasks 9–13). Create empty stub factories first so it compiles, then flesh each out in its task. Minimal stubs to add now:
>
> ```ts
> // each repositories/*.repository.ts — temporary stub, replaced in its own task
> import type { DbDriver } from '../db/driver';
> import type { CoreDeps } from '../db/database';
> export function makeSettingsRepository(_d: DbDriver, _deps: CoreDeps) { return { get: async () => { throw new Error('todo'); } }; }
> ```
>
> Use the matching factory name per file: `makeProfilesRepository(_d, _deps)`, `makeRegionsRepository(_d)`, `makeEntriesRepository(_d, _deps)`, `makeAttachmentsRepository(_d, _deps)`. Each stub returns an object with the methods asserted in Task 8's test (`create`, `get`, `list`, etc.) throwing `'todo'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/db/database.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/db/database.ts packages/core/src/db/database.test.ts packages/core/src/repositories
git commit -m "feat(core): wire openDatabase with repository stubs"
```

---

### Task 9: Settings repository

**Files:**
- Modify: `packages/core/src/repositories/settings.repository.ts`
- Test: `packages/core/src/repositories/settings.repository.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/repositories/settings.repository.test.ts`
Expected: FAIL — stub throws `'todo'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/repositories/settings.repository.ts
import type { DbDriver } from '../db/driver';
import type { CoreDeps } from '../db/database';
import { SizeLevel, type AppSettings } from '../schemas/settings.schema';

interface SettingsRow {
  size_level: number;
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
      onboardingDone: row.onboarding_done === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async function setSizeLevel(level: number): Promise<void> {
    const valid = SizeLevel.parse(level);
    await driver.run('UPDATE app_settings SET size_level = ?, updated_at = ? WHERE id = 1', [valid, deps.now()]);
  }

  async function completeOnboarding(): Promise<void> {
    await driver.run('UPDATE app_settings SET onboarding_done = 1, updated_at = ? WHERE id = 1', [deps.now()]);
  }

  return { get, setSizeLevel, completeOnboarding };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/repositories/settings.repository.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/repositories/settings.repository.ts packages/core/src/repositories/settings.repository.test.ts
git commit -m "feat(core): implement settings repository"
```

---

### Task 10: Profiles repository

**Files:**
- Modify: `packages/core/src/repositories/profiles.repository.ts`
- Test: `packages/core/src/repositories/profiles.repository.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/repositories/profiles.repository.test.ts
import { describe, it, expect } from 'vitest';
import { makeTestDb } from '../test/makeTestDb';

describe('profiles repository', () => {
  it('creates, lists, gets, updates, and deletes', async () => {
    const { db } = await makeTestDb();
    const created = await db.profiles.create({ name: 'Marcus Chen', dob: '1987-03-14', sex: 'male' });
    expect(created.id).toBe('id-1');
    expect(created.createdAt).toBe(created.updatedAt);

    const list = await db.profiles.list();
    expect(list).toHaveLength(1);

    const got = await db.profiles.get('id-1');
    expect(got?.name).toBe('Marcus Chen');

    const updated = await db.profiles.update('id-1', { name: 'Marcus C.' });
    expect(updated.name).toBe('Marcus C.');

    await db.profiles.remove('id-1');
    expect(await db.profiles.get('id-1')).toBeUndefined();
  });

  it('rejects invalid input', async () => {
    const { db } = await makeTestDb();
    await expect(db.profiles.create({ name: '', dob: 'nope', sex: 'male' } as never)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/repositories/profiles.repository.test.ts`
Expected: FAIL — stub throws.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/repositories/profiles.repository.ts
import type { DbDriver } from '../db/driver';
import type { CoreDeps } from '../db/database';
import {
  createProfileInput,
  updateProfileInput,
  type CreateProfileInput,
  type UpdateProfileInput,
  type Profile,
} from '../schemas/profile.schema';
import type { Sex } from '../schemas/enums';

interface ProfileRow {
  id: string;
  name: string;
  dob: string;
  sex: string;
  created_at: string;
  updated_at: string;
}

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  name: r.name,
  dob: r.dob,
  sex: r.sex as Sex,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export function makeProfilesRepository(driver: DbDriver, deps: CoreDeps) {
  async function create(input: CreateProfileInput): Promise<Profile> {
    const data = createProfileInput.parse(input);
    const id = deps.genId();
    const ts = deps.now();
    await driver.run(
      'INSERT INTO profiles (id, name, dob, sex, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.name, data.dob, data.sex, ts, ts],
    );
    return { id, ...data, createdAt: ts, updatedAt: ts };
  }

  async function list(): Promise<Profile[]> {
    const rows = await driver.all<ProfileRow>('SELECT * FROM profiles ORDER BY created_at ASC');
    return rows.map(toProfile);
  }

  async function get(id: string): Promise<Profile | undefined> {
    const row = await driver.get<ProfileRow>('SELECT * FROM profiles WHERE id = ?', [id]);
    return row ? toProfile(row) : undefined;
  }

  async function update(id: string, input: UpdateProfileInput): Promise<Profile> {
    const data = updateProfileInput.parse(input);
    const ts = deps.now();
    const fields: string[] = [];
    const params: (string | null)[] = [];
    for (const key of ['name', 'dob', 'sex'] as const) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key] as string);
      }
    }
    fields.push('updated_at = ?');
    params.push(ts, id);
    await driver.run(`UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`, params);
    const updated = await get(id);
    if (!updated) throw new Error(`profile ${id} not found`);
    return updated;
  }

  async function remove(id: string): Promise<void> {
    await driver.run('DELETE FROM profiles WHERE id = ?', [id]);
  }

  return { create, list, get, update, remove };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/repositories/profiles.repository.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/repositories/profiles.repository.ts packages/core/src/repositories/profiles.repository.test.ts
git commit -m "feat(core): implement profiles repository"
```

---

### Task 11: Entries repository

**Files:**
- Modify: `packages/core/src/repositories/entries.repository.ts`
- Test: `packages/core/src/repositories/entries.repository.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/repositories/entries.repository.test.ts
import { describe, it, expect } from 'vitest';
import { makeTestDb } from '../test/makeTestDb';

async function seedProfile(db: Awaited<ReturnType<typeof makeTestDb>>['db']) {
  return db.profiles.create({ name: 'P', dob: '1990-01-01', sex: 'male' });
}

describe('entries repository', () => {
  it('creates an entry with extras and round-trips details JSON', async () => {
    const { db } = await makeTestDb();
    const p = await seedProfile(db);
    const e = await db.entries.create({
      profileId: p.id,
      regionCode: 'knee-right',
      type: 'visit',
      date: '2026-02-18',
      title: 'Ortho',
      body: 'knee pain',
      doctor: 'Dr. Park',
      diagnosis: 'Tendinopathy',
      details: { followUpWeeks: 6 },
    });
    expect(e.id).toBe('id-2'); // id-1 was the profile
    expect(e.regionCode).toBe('knee-right');
    expect(e.details).toEqual({ followUpWeeks: 6 });

    const fetched = await db.entries.get(e.id);
    expect(fetched?.doctor).toBe('Dr. Park');
    expect(fetched?.details).toEqual({ followUpWeeks: 6 });
  });

  it('lists by region + type, newest first', async () => {
    const { db, deps } = await makeTestDb();
    const p = await seedProfile(db);
    await db.entries.create({ profileId: p.id, regionCode: 'knee-right', type: 'note', date: '2026-01-01', title: 'old', body: 'b' });
    deps.advance(1000);
    await db.entries.create({ profileId: p.id, regionCode: 'knee-right', type: 'note', date: '2026-03-01', title: 'new', body: 'b' });

    const notes = await db.entries.listByRegion(p.id, 'knee-right', 'note');
    expect(notes.map((n) => n.title)).toEqual(['new', 'old']);
  });

  it('supports region-less General entries', async () => {
    const { db } = await makeTestDb();
    const p = await seedProfile(db);
    await db.entries.create({ profileId: p.id, regionCode: null, type: 'prescription', date: '2026-01-01', title: 'Flu shot', body: 'b' });
    const general = await db.entries.listGeneral(p.id, 'prescription');
    expect(general).toHaveLength(1);
  });

  it('returns per-region counts including a null (General) bucket', async () => {
    const { db } = await makeTestDb();
    const p = await seedProfile(db);
    await db.entries.create({ profileId: p.id, regionCode: 'knee-right', type: 'note', date: '2026-01-01', title: 'a', body: 'b' });
    await db.entries.create({ profileId: p.id, regionCode: 'knee-right', type: 'visit', date: '2026-01-02', title: 'c', body: 'b' });
    await db.entries.create({ profileId: p.id, regionCode: null, type: 'note', date: '2026-01-03', title: 'g', body: 'b' });

    const counts = await db.entries.countsByRegion(p.id);
    expect(counts.get('knee-right')).toBe(2);
    expect(counts.get(null)).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/repositories/entries.repository.test.ts`
Expected: FAIL — stub throws.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/repositories/entries.repository.ts
import type { DbDriver } from '../db/driver';
import type { CoreDeps } from '../db/database';
import { createEntryInput, type CreateEntryInput, type Entry } from '../schemas/entry.schema';
import type { EntryType, ImagingSubtype } from '../schemas/enums';

interface EntryRow {
  id: string;
  profile_id: string;
  region_code: string | null;
  type: string;
  subtype: string | null;
  date: string;
  title: string;
  body: string;
  doctor: string | null;
  diagnosis: string | null;
  prescriber: string | null;
  duration: string | null;
  facility: string | null;
  details: string | null;
  created_at: string;
  updated_at: string;
}

const toEntry = (r: EntryRow): Entry => ({
  id: r.id,
  profileId: r.profile_id,
  regionCode: r.region_code,
  type: r.type as EntryType,
  subtype: (r.subtype as ImagingSubtype | null) ?? null,
  date: r.date,
  title: r.title,
  body: r.body,
  doctor: r.doctor,
  diagnosis: r.diagnosis,
  prescriber: r.prescriber,
  duration: r.duration,
  facility: r.facility,
  details: r.details ? (JSON.parse(r.details) as Record<string, unknown>) : null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// Order by entry date desc, then creation time desc as a tiebreaker.
const ORDER = 'ORDER BY date DESC, created_at DESC';

export function makeEntriesRepository(driver: DbDriver, deps: CoreDeps) {
  async function create(input: CreateEntryInput): Promise<Entry> {
    const data = createEntryInput.parse(input);
    if (!data.profileId) throw new Error('profileId is required');
    const id = deps.genId();
    const ts = deps.now();
    await driver.run(
      `INSERT INTO entries
        (id, profile_id, region_code, type, subtype, date, title, body,
         doctor, diagnosis, prescriber, duration, facility, details, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.profileId,
        data.regionCode ?? null,
        data.type,
        data.subtype ?? null,
        data.date,
        data.title,
        data.body,
        data.doctor ?? null,
        data.diagnosis ?? null,
        data.prescriber ?? null,
        data.duration ?? null,
        data.facility ?? null,
        data.details ? JSON.stringify(data.details) : null,
        ts,
        ts,
      ],
    );
    const created = await get(id);
    if (!created) throw new Error('entry insert failed');
    return created;
  }

  async function get(id: string): Promise<Entry | undefined> {
    const row = await driver.get<EntryRow>('SELECT * FROM entries WHERE id = ?', [id]);
    return row ? toEntry(row) : undefined;
  }

  async function listByRegion(profileId: string, regionCode: string, type: EntryType): Promise<Entry[]> {
    const rows = await driver.all<EntryRow>(
      `SELECT * FROM entries WHERE profile_id = ? AND region_code = ? AND type = ? ${ORDER}`,
      [profileId, regionCode, type],
    );
    return rows.map(toEntry);
  }

  async function listGeneral(profileId: string, type: EntryType): Promise<Entry[]> {
    const rows = await driver.all<EntryRow>(
      `SELECT * FROM entries WHERE profile_id = ? AND region_code IS NULL AND type = ? ${ORDER}`,
      [profileId, type],
    );
    return rows.map(toEntry);
  }

  /** Map of region_code (or null for General) → entry count, for the body screen dots. */
  async function countsByRegion(profileId: string): Promise<Map<string | null, number>> {
    const rows = await driver.all<{ region_code: string | null; c: number }>(
      'SELECT region_code, COUNT(*) AS c FROM entries WHERE profile_id = ? GROUP BY region_code',
      [profileId],
    );
    return new Map(rows.map((r) => [r.region_code, r.c]));
  }

  async function remove(id: string): Promise<void> {
    await driver.run('DELETE FROM entries WHERE id = ?', [id]);
  }

  return { create, get, listByRegion, listGeneral, countsByRegion, remove };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/repositories/entries.repository.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/repositories/entries.repository.ts packages/core/src/repositories/entries.repository.test.ts
git commit -m "feat(core): implement entries repository with region counts"
```

---

### Task 12: Attachments repository

**Files:**
- Modify: `packages/core/src/repositories/attachments.repository.ts`
- Test: `packages/core/src/repositories/attachments.repository.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/repositories/attachments.repository.test.ts
import { describe, it, expect } from 'vitest';
import { makeTestDb } from '../test/makeTestDb';

describe('attachments repository', () => {
  it('stores metadata, lists by entry, and cascades on entry delete', async () => {
    const { db } = await makeTestDb();
    const p = await db.profiles.create({ name: 'P', dob: '1990-01-01', sex: 'male' });
    const e = await db.entries.create({
      profileId: p.id, regionCode: 'ribs', type: 'imaging_test', subtype: 'imaging',
      date: '2024-10-05', title: 'X-ray', body: 'no fracture', facility: 'Valley',
    });

    const a = await db.attachments.create({
      entryId: e.id,
      relativePath: `attachments/${e.id}/scan.jpg`,
      mimeType: 'image/jpeg',
      originalFilename: 'scan.jpg',
      sizeBytes: 1024,
    });
    expect(a.relativePath).toContain(e.id);

    const list = await db.attachments.listByEntry(e.id);
    expect(list).toHaveLength(1);

    await db.entries.remove(e.id);
    expect(await db.attachments.listByEntry(e.id)).toHaveLength(0); // FK cascade
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/repositories/attachments.repository.test.ts`
Expected: FAIL — stub throws.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/repositories/attachments.repository.ts
import type { DbDriver } from '../db/driver';
import type { CoreDeps } from '../db/database';
import { createAttachmentInput, type CreateAttachmentInput, type Attachment } from '../schemas/attachment.schema';

interface AttachmentRow {
  id: string;
  entry_id: string;
  relative_path: string;
  mime_type: string;
  original_filename: string | null;
  size_bytes: number | null;
  created_at: string;
}

const toAttachment = (r: AttachmentRow): Attachment => ({
  id: r.id,
  entryId: r.entry_id,
  relativePath: r.relative_path,
  mimeType: r.mime_type,
  originalFilename: r.original_filename,
  sizeBytes: r.size_bytes,
  createdAt: r.created_at,
});

export function makeAttachmentsRepository(driver: DbDriver, deps: CoreDeps) {
  async function create(input: CreateAttachmentInput): Promise<Attachment> {
    const data = createAttachmentInput.parse(input);
    const id = deps.genId();
    const ts = deps.now();
    await driver.run(
      `INSERT INTO attachments (id, entry_id, relative_path, mime_type, original_filename, size_bytes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.entryId, data.relativePath, data.mimeType, data.originalFilename ?? null, data.sizeBytes ?? null, ts],
    );
    return {
      id,
      entryId: data.entryId,
      relativePath: data.relativePath,
      mimeType: data.mimeType,
      originalFilename: data.originalFilename ?? null,
      sizeBytes: data.sizeBytes ?? null,
      createdAt: ts,
    };
  }

  async function listByEntry(entryId: string): Promise<Attachment[]> {
    const rows = await driver.all<AttachmentRow>(
      'SELECT * FROM attachments WHERE entry_id = ? ORDER BY created_at ASC',
      [entryId],
    );
    return rows.map(toAttachment);
  }

  async function remove(id: string): Promise<void> {
    await driver.run('DELETE FROM attachments WHERE id = ?', [id]);
  }

  return { create, listByEntry, remove };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/repositories/attachments.repository.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/repositories/attachments.repository.ts packages/core/src/repositories/attachments.repository.test.ts
git commit -m "feat(core): implement attachments repository"
```

---

### Task 13: Regions repository + public barrel

**Files:**
- Modify: `packages/core/src/repositories/regions.repository.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/repositories/regions.repository.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/repositories/regions.repository.test.ts
import { describe, it, expect } from 'vitest';
import { makeTestDb } from '../test/makeTestDb';

describe('regions repository', () => {
  it('lists all seeded regions and filters by zone', async () => {
    const { db } = await makeTestDb();
    const all = await db.regions.list();
    expect(all).toHaveLength(40);

    const legs = await db.regions.listByZone('leg');
    expect(legs.every((r) => r.zone === 'leg')).toBe(true);
    expect(legs.find((r) => r.code === 'knee-right')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/repositories/regions.repository.test.ts`
Expected: FAIL — stub throws.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/repositories/regions.repository.ts
import type { DbDriver } from '../db/driver';
import type { RegionSide, RegionZone } from '../schemas/enums';

export interface BodyRegion {
  code: string;
  label: string;
  zone: RegionZone;
  side: RegionSide | null;
}

interface RegionRow {
  code: string;
  label: string;
  zone: string;
  side: string | null;
}

const toRegion = (r: RegionRow): BodyRegion => ({
  code: r.code,
  label: r.label,
  zone: r.zone as RegionZone,
  side: (r.side as RegionSide | null) ?? null,
});

export function makeRegionsRepository(driver: DbDriver) {
  async function list(): Promise<BodyRegion[]> {
    const rows = await driver.all<RegionRow>('SELECT * FROM body_regions ORDER BY code ASC');
    return rows.map(toRegion);
  }

  async function listByZone(zone: RegionZone): Promise<BodyRegion[]> {
    const rows = await driver.all<RegionRow>('SELECT * FROM body_regions WHERE zone = ? ORDER BY code ASC', [zone]);
    return rows.map(toRegion);
  }

  return { list, listByZone };
}
```

Replace `packages/core/src/index.ts` with the public surface:

```ts
// packages/core/src/index.ts
export { openDatabase, type Database, type CoreDeps } from './db/database';
export type { DbDriver, SqlParam } from './db/driver';

export type { Profile } from './schemas/profile.schema';
export type { Entry } from './schemas/entry.schema';
export type { Attachment } from './schemas/attachment.schema';
export type { AppSettings } from './schemas/settings.schema';
export type { BodyRegion } from './repositories/regions.repository';
export {
  createProfileInput, updateProfileInput,
  type CreateProfileInput, type UpdateProfileInput,
} from './schemas/profile.schema';
export { createEntryInput, type CreateEntryInput } from './schemas/entry.schema';
export { createAttachmentInput, type CreateAttachmentInput } from './schemas/attachment.schema';
export {
  Sex, EntryType, ImagingSubtype, RegionSide, RegionZone,
} from './schemas/enums';
```

- [ ] **Step 4: Run the FULL suite**

Run: `pnpm --filter @med-history/core test`
Expected: PASS — all tests across tasks 1–13 green.

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm --filter @med-history/core typecheck
git add packages/core/src/repositories/regions.repository.ts packages/core/src/repositories/regions.repository.test.ts packages/core/src/index.ts
git commit -m "feat(core): implement regions repository and public API"
```

---

## Self-review

**Spec coverage:**
- `app_settings` + size level → Tasks 7, 9. ✓
- `profiles` → Tasks 7, 10. ✓
- `body_regions` seed (~40) → Tasks 5, 7, 13. ✓
- Unified `entries` with type/subtype/details/nullable region → Tasks 4, 7, 11. ✓
- `attachments` (relative paths, cascade) → Tasks 7, 12. ✓
- Per-region counts for body-screen dots + General bucket → Task 11 (`countsByRegion`, `listGeneral`). ✓
- App-layer type validation (no DB CHECK on type) → Task 4 (zod), Task 7 (no CHECK in DDL). ✓
- Migration runner via `user_version` → Task 6. ✓
- File bytes / FileSystem I/O → **out of scope for core** (lives in the mobile repositories plan); core stores only metadata + `relative_path`. Noted, not a gap.
- Size-level → multiplier curves constant → **deferred to the mobile/theme plan** (spec says it lives in core *or* the mobile theme; it's pure UI tuning with no DB dependency). Acceptable deferral.

**Placeholder scan:** Task 8 intentionally introduces temporary repository stubs, each replaced in its own task (9–13) — every stub has a concrete follow-up task. No "TBD"/"add error handling"-style gaps.

**Type consistency:** Factory names (`makeSettingsRepository`, `makeProfilesRepository`, `makeRegionsRepository`, `makeEntriesRepository`, `makeAttachmentsRepository`), `CoreDeps { genId, now }`, row→domain mappers, and method names (`create/get/list/listByRegion/listGeneral/countsByRegion/remove`) are consistent across the database wiring (Task 8) and each repository task.

---

## Notes for the next plan (mobile UI — not built here)

- An `expo-sqlite` `DbDriver` adapter in `apps/mobile/src/.../repositories/` wrapping `SQLiteDatabase` async methods, plus `genId` (expo-crypto `randomUUID`) and `now` (`() => new Date().toISOString()`).
- Onboarding size-selector screen (writes `setSizeLevel` + `completeOnboarding`), Profiles list, Body screen (SVG + dots driven by `countsByRegion`, plus the always-present "General" control), Region detail (tabs → `listByRegion`/`listGeneral`), and the add-entry form.
- Attachment file I/O (Expo FileSystem) + the `size_level → text/figure multiplier` curve from the spec.
