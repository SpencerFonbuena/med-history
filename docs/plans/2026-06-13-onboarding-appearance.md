# Onboarding & Appearance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First-run onboarding where the user picks a size (text + person figure) and a light/dark theme, then acknowledges an on-device-only privacy statement — plus the app's first real SQLite wiring, theme, and size-scaling infrastructure.

**Architecture:** Core gains a `theme` column (migration 2) and `setTheme`. The mobile app bakes the size level into `theme` via `useTheme()` (typography scale × level multipliers) fed by an `<AppearanceProvider>` (effective settings + live preview override). Core runs on-device through an `expo-sqlite` `DbDriver` adapter; the `features/settings` feature reads/writes `app_settings` via react-query. Onboarding is a 3-step Expo Router stack gated on `onboarding_done`.

**Tech Stack:** TypeScript, packages/core (zod, vitest), Expo SDK 54 (expo-router, expo-sqlite, expo-crypto, react-native-svg), @tanstack/react-query, vitest (mobile pure-logic tests).

**Branch:** `feat/onboarding-appearance` (stacked on `feat/core-data-layer`). Spec: `docs/specs/2026-06-13-onboarding-appearance-design.md`.

**Verification note:** Tasks 1–9 have real vitest tests. Tasks 10–17 are RN/Expo and have **no automated tests in this environment** (no simulator) — they are verified by `tsc --noEmit` and an on-device manual checklist (Task 17). Each such task says so explicitly.

---

## File structure

```
packages/core/src/
  schemas/enums.ts                         # + Theme enum
  schemas/settings.schema.ts               # AppSettings + theme
  db/migrations/m2-theme.ts                # ALTER TABLE add theme
  db/migrations/index.ts                   # register m2
  repositories/settings.repository.ts      # + setTheme; get() returns theme
apps/mobile/
  vitest.config.ts                         # node env, src/**/*.test.ts
  src/
    lib/result.ts                          # Result<T>
    constants/typography.ts                # baseType + scaleType(level)
    constants/appearance.ts                # SizeLevel, labels, textScale/figureScale
    constants/theme.ts                     # getTheme(scheme, sizeLevel) → + text + figureScale
    hooks/useColorScheme.hook.ts           # (exists) OS scheme
    hooks/useTheme.hook.ts                 # reads AppearanceProvider
    lib/db/expoSqliteDriver.ts             # DbDriver over expo-sqlite
    lib/db/database.ts                     # getDatabase() singleton
    providers/QueryProvider.tsx
    features/settings/
      schemas/appearance.ts                # SizeLevel/Scheme/Appearance types
      context/appearanceReducer.ts         # pure reducer + resolveAppearance
      context/appearance.provider.tsx      # AppearanceProvider + useAppearance
      repositories/settings.repository.ts  # wraps getDatabase().settings
      services/coordinators/settings.coordinator.ts
      queryKeys.ts
      hooks/useSettings.hook.ts
      hooks/useUpdateAppearance.hook.ts
      components/personFigure.component.tsx
      components/sizeSelector.component.tsx
      components/themeSelector.component.tsx
    app/_layout.tsx                        # providers + onboarding gate
    app/(onboarding)/_layout.tsx
    app/(onboarding)/size.tsx
    app/(onboarding)/theme.tsx
    app/(onboarding)/privacy.tsx
```

---

### Task 1: Core — Theme enum + migration 2

**Files:**
- Modify: `packages/core/src/schemas/enums.ts`
- Create: `packages/core/src/db/migrations/m2-theme.ts`
- Modify: `packages/core/src/db/migrations/index.ts`
- Test: `packages/core/src/db/migrations/m2-theme.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/db/migrations/m2-theme.test.ts
import { describe, it, expect } from 'vitest';
import { makeBetterSqliteDriver } from '../../test/betterSqliteDriver';
import { migrate } from '../migrate';
import { migrations } from './index';

describe('migration 2 (theme)', () => {
  it('adds a theme column defaulting to dark, and stays idempotent', async () => {
    const d = makeBetterSqliteDriver(':memory:');
    await migrate(d, migrations);

    const v = await d.get<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(2);

    const row = await d.get<{ theme: string }>('SELECT theme FROM app_settings WHERE id = 1');
    expect(row?.theme).toBe('dark');

    await migrate(d, migrations); // second run is a no-op
    const v2 = await d.get<{ user_version: number }>('PRAGMA user_version');
    expect(v2?.user_version).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/db/migrations/m2-theme.test.ts`
Expected: FAIL — `user_version` is 1 / no `theme` column.

- [ ] **Step 3: Write minimal implementation**

Append to `packages/core/src/schemas/enums.ts`:
```ts
export const Theme = z.enum(['light', 'dark']);
export type Theme = z.infer<typeof Theme>;
```

```ts
// packages/core/src/db/migrations/m2-theme.ts
import type { Migration } from '../migrate';

export const m2Theme: Migration = {
  version: 2,
  up: async (d) => {
    await d.exec("ALTER TABLE app_settings ADD COLUMN theme TEXT NOT NULL DEFAULT 'dark'");
  },
};
```

Replace `packages/core/src/db/migrations/index.ts`:
```ts
import type { Migration } from '../migrate';
import { m1Initial } from './m1-initial';
import { m2Theme } from './m2-theme';

export const migrations: Migration[] = [m1Initial, m2Theme];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/db/migrations/m2-theme.test.ts`
Expected: PASS. Also run the full core suite: `pnpm --filter @med-history/core test` (all green — the m1 test still sees `user_version` 2 only via the runner; its own assertions don't check the version).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/schemas/enums.ts packages/core/src/db/migrations
git commit -m "feat(core): add theme column via migration 2"
```

---

### Task 2: Core — settings repo theme support

**Files:**
- Modify: `packages/core/src/schemas/settings.schema.ts`
- Modify: `packages/core/src/repositories/settings.repository.ts`
- Modify: `packages/core/src/repositories/settings.repository.test.ts`

- [ ] **Step 1: Write the failing test (append to the existing settings test file)**

```ts
// add inside packages/core/src/repositories/settings.repository.test.ts
import { describe, it, expect } from 'vitest';
import { makeTestDb } from '../test/makeTestDb';

describe('settings repository — theme', () => {
  it('defaults to dark and updates', async () => {
    const { db } = await makeTestDb();
    expect((await db.settings.get()).theme).toBe('dark');

    await db.settings.setTheme('light');
    expect((await db.settings.get()).theme).toBe('light');
  });

  it('rejects an invalid theme', async () => {
    const { db } = await makeTestDb();
    await expect(db.settings.setTheme('blue' as never)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/repositories/settings.repository.test.ts`
Expected: FAIL — `theme` undefined / `setTheme` not a function.

- [ ] **Step 3: Write minimal implementation**

In `packages/core/src/schemas/settings.schema.ts`, add `theme` to `AppSettings`:
```ts
import type { Theme } from './enums';

export interface AppSettings {
  sizeLevel: number;
  theme: Theme;
  onboardingDone: boolean;
  createdAt: string;
  updatedAt: string;
}
```
(Keep the existing `SizeLevel` export.)

In `packages/core/src/repositories/settings.repository.ts`: add `theme` to `SettingsRow`, map it in `get()`, and add `setTheme`. Full updated file:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/repositories/settings.repository.test.ts`
Expected: PASS. Then full suite + typecheck: `pnpm --filter @med-history/core test && pnpm --filter @med-history/core typecheck` (both clean).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/schemas/settings.schema.ts packages/core/src/repositories/settings.repository.ts packages/core/src/repositories/settings.repository.test.ts
git commit -m "feat(core): persist theme in settings repository"
```

---

### Task 3: Core — export Theme from public barrel

**Files:**
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/barrel.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/barrel.test.ts
import { describe, it, expect } from 'vitest';
import { Theme } from './index';

describe('public barrel', () => {
  it('exports the Theme enum', () => {
    expect(Theme.parse('light')).toBe('light');
    expect(() => Theme.parse('x')).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/core test src/barrel.test.ts`
Expected: FAIL — `Theme` not exported.

- [ ] **Step 3: Write minimal implementation**

In `packages/core/src/index.ts`, add `Theme` to the enums export line:
```ts
export {
  Sex, EntryType, ImagingSubtype, RegionSide, RegionZone, Theme,
} from './schemas/enums';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/core test src/barrel.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/index.ts packages/core/src/barrel.test.ts
git commit -m "feat(core): export Theme from public API"
```

---

### Task 4: Mobile — vitest harness for pure logic

**Files:**
- Modify: `apps/mobile/package.json` (add devDeps + script)
- Create: `apps/mobile/vitest.config.ts`
- Test: `apps/mobile/src/lib/result.test.ts` (created in Task 5; this task just stands up the runner with a temporary smoke test)
- Create: `apps/mobile/src/_vitest-smoke.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/_vitest-smoke.test.ts
import { describe, it, expect } from 'vitest';
describe('mobile vitest', () => {
  it('runs', () => expect(1 + 1).toBe(2));
});
```

- [ ] **Step 2: Run to verify it fails (no runner yet)**

Run: `pnpm --filter @med-history/mobile exec vitest run src/_vitest-smoke.test.ts`
Expected: FAIL — vitest not installed.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/mobile/vitest.config.ts
import { defineConfig } from 'vitest/config';

// Pure-logic tests only (node env). RN/Expo component files are NOT tested here.
export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'], exclude: ['**/node_modules/**'] },
});
```

Add to `apps/mobile/package.json` `devDependencies`: `"vitest": "^2.1.0"`, and to `scripts`: `"test": "vitest run"`. Then `pnpm install` from repo root.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/mobile test src/_vitest-smoke.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/package.json apps/mobile/vitest.config.ts apps/mobile/src/_vitest-smoke.test.ts
git commit -m "chore(mobile): add vitest for pure-logic unit tests"
```

---

### Task 5: Mobile — Result type

**Files:**
- Create: `apps/mobile/src/lib/result.ts`
- Test: `apps/mobile/src/lib/result.test.ts`
- Delete: `apps/mobile/src/_vitest-smoke.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/lib/result.test.ts
import { describe, it, expect } from 'vitest';
import { ok, err, type Result } from './result';

describe('Result', () => {
  it('constructs ok and err', () => {
    const a: Result<number> = ok(5);
    const b: Result<number> = err('nope');
    expect(a).toEqual({ ok: true, data: 5 });
    expect(b).toEqual({ ok: false, error: 'nope' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/mobile test src/lib/result.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/mobile/src/lib/result.ts
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const err = <T = never>(error: string): Result<T> => ({ ok: false, error });
```

Delete the smoke test: `git rm apps/mobile/src/_vitest-smoke.test.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/mobile test src/lib/result.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/result.ts apps/mobile/src/lib/result.test.ts
git rm apps/mobile/src/_vitest-smoke.test.ts
git commit -m "feat(mobile): add Result<T> type"
```

---

### Task 6: Mobile — appearance constants (size levels + multipliers)

**Files:**
- Create: `apps/mobile/src/constants/appearance.ts`
- Test: `apps/mobile/src/constants/appearance.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/constants/appearance.test.ts
import { describe, it, expect } from 'vitest';
import { SIZE_LEVELS, SIZE_LABELS, textScale, figureScale } from './appearance';

describe('appearance constants', () => {
  it('has 5 levels with labels', () => {
    expect(SIZE_LEVELS).toEqual([1, 2, 3, 4, 5]);
    expect(SIZE_LABELS[1]).toBe('Default');
    expect(SIZE_LABELS[5]).toBe('Very large');
  });

  it('maps levels to multipliers (level 1 is identity)', () => {
    expect(textScale(1)).toBe(1);
    expect(figureScale(1)).toBe(1);
    expect(textScale(5)).toBe(2);
    expect(figureScale(5)).toBeCloseTo(1.45);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/mobile test src/constants/appearance.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/mobile/src/constants/appearance.ts
export const SIZE_LEVELS = [1, 2, 3, 4, 5] as const;
export type SizeLevel = (typeof SIZE_LEVELS)[number];

export const SIZE_LABELS: Record<SizeLevel, string> = {
  1: 'Default',
  2: 'Large',
  3: 'Larger',
  4: 'Extra large',
  5: 'Very large',
};

const TEXT_SCALE: Record<SizeLevel, number> = { 1: 1.0, 2: 1.15, 3: 1.35, 4: 1.65, 5: 2.0 };
const FIGURE_SCALE: Record<SizeLevel, number> = { 1: 1.0, 2: 1.08, 3: 1.18, 4: 1.3, 5: 1.45 };

export const textScale = (level: SizeLevel): number => TEXT_SCALE[level];
export const figureScale = (level: SizeLevel): number => FIGURE_SCALE[level];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/mobile test src/constants/appearance.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/constants/appearance.ts apps/mobile/src/constants/appearance.test.ts
git commit -m "feat(mobile): add size-level appearance constants"
```

---

### Task 7: Mobile — typography scale

**Files:**
- Create: `apps/mobile/src/constants/typography.ts`
- Test: `apps/mobile/src/constants/typography.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/constants/typography.test.ts
import { describe, it, expect } from 'vitest';
import { baseType, scaleType } from './typography';

describe('typography', () => {
  it('level 1 returns the base sizes', () => {
    expect(scaleType(1)).toEqual(baseType);
  });

  it('level 5 doubles and rounds', () => {
    const t = scaleType(5);
    expect(t.body).toBe(Math.round(baseType.body * 2));
    expect(t.hero).toBe(Math.round(baseType.hero * 2));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/mobile test src/constants/typography.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/mobile/src/constants/typography.ts
import { textScale, type SizeLevel } from './appearance';

export const baseType = {
  caption: 12,
  footnote: 13,
  body: 15,
  callout: 16,
  subtitle: 18,
  title: 20,
  largeTitle: 26,
  hero: 32,
} as const;

export type TypeScale = Record<keyof typeof baseType, number>;

/** Base type sizes multiplied by the level's text scale and rounded. */
export function scaleType(level: SizeLevel): TypeScale {
  const f = textScale(level);
  const out = {} as TypeScale;
  for (const key of Object.keys(baseType) as (keyof typeof baseType)[]) {
    out[key] = Math.round(baseType[key] * f);
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/mobile test src/constants/typography.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/constants/typography.ts apps/mobile/src/constants/typography.test.ts
git commit -m "feat(mobile): add scalable typography constants"
```

---

### Task 8: Mobile — appearance types + pure reducer

**Files:**
- Create: `apps/mobile/src/features/settings/schemas/appearance.ts`
- Create: `apps/mobile/src/features/settings/context/appearanceReducer.ts`
- Test: `apps/mobile/src/features/settings/context/appearanceReducer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/features/settings/context/appearanceReducer.test.ts
import { describe, it, expect } from 'vitest';
import { appearanceReducer, resolveAppearance, initialAppearance } from './appearanceReducer';

describe('appearance reducer', () => {
  it('resolves effective when no preview', () => {
    const s = initialAppearance({ scheme: 'dark', sizeLevel: 2 });
    expect(resolveAppearance(s)).toEqual({ scheme: 'dark', sizeLevel: 2 });
  });

  it('preview overrides effective, then clears', () => {
    let s = initialAppearance({ scheme: 'dark', sizeLevel: 1 });
    s = appearanceReducer(s, { type: 'setPreview', preview: { sizeLevel: 5 } });
    expect(resolveAppearance(s)).toEqual({ scheme: 'dark', sizeLevel: 5 });
    s = appearanceReducer(s, { type: 'setPreview', preview: { scheme: 'light' } });
    expect(resolveAppearance(s)).toEqual({ scheme: 'light', sizeLevel: 5 });
    s = appearanceReducer(s, { type: 'clearPreview' });
    expect(resolveAppearance(s)).toEqual({ scheme: 'dark', sizeLevel: 1 });
  });

  it('setEffective replaces persisted values', () => {
    let s = initialAppearance({ scheme: 'dark', sizeLevel: 1 });
    s = appearanceReducer(s, { type: 'setEffective', effective: { scheme: 'light', sizeLevel: 3 } });
    expect(resolveAppearance(s)).toEqual({ scheme: 'light', sizeLevel: 3 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/mobile test src/features/settings/context/appearanceReducer.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/mobile/src/features/settings/schemas/appearance.ts
import type { SizeLevel } from '@/constants/appearance';

export type Scheme = 'light' | 'dark';
export interface Appearance {
  scheme: Scheme;
  sizeLevel: SizeLevel;
}
```

```ts
// apps/mobile/src/features/settings/context/appearanceReducer.ts
import type { Appearance } from '../schemas/appearance';

export interface AppearanceState {
  effective: Appearance;
  preview: Partial<Appearance> | null;
}

export type AppearanceAction =
  | { type: 'setEffective'; effective: Appearance }
  | { type: 'setPreview'; preview: Partial<Appearance> }
  | { type: 'clearPreview' };

export const initialAppearance = (effective: Appearance): AppearanceState => ({
  effective,
  preview: null,
});

export function appearanceReducer(state: AppearanceState, action: AppearanceAction): AppearanceState {
  switch (action.type) {
    case 'setEffective':
      return { ...state, effective: action.effective };
    case 'setPreview':
      return { ...state, preview: { ...state.preview, ...action.preview } };
    case 'clearPreview':
      return { ...state, preview: null };
  }
}

/** The appearance actually shown = effective with any preview applied on top. */
export function resolveAppearance(state: AppearanceState): Appearance {
  return { ...state.effective, ...(state.preview ?? {}) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/mobile test src/features/settings/context/appearanceReducer.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/settings/schemas apps/mobile/src/features/settings/context/appearanceReducer.ts apps/mobile/src/features/settings/context/appearanceReducer.test.ts
git commit -m "feat(mobile): add appearance reducer and types"
```

---

### Task 9: Mobile — settings coordinator (testable with a fake repo)

**Files:**
- Create: `apps/mobile/src/features/settings/services/coordinators/settings.coordinator.ts`
- Test: `apps/mobile/src/features/settings/services/coordinators/settings.coordinator.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/features/settings/services/coordinators/settings.coordinator.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/mobile test src/features/settings/services/coordinators/settings.coordinator.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/mobile/src/features/settings/services/coordinators/settings.coordinator.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/mobile test src/features/settings/services/coordinators/settings.coordinator.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/settings/services
git commit -m "feat(mobile): add settings coordinator returning Result"
```

---

> **Tasks 10–17 are RN/Expo. No simulator exists in this environment, so each is verified by `tsc --noEmit` only; on-device behavior is checked in Task 17. Do not claim runtime success — only typecheck success.**

### Task 10: Mobile — expo-sqlite driver + getDatabase

**Files:**
- Create: `apps/mobile/src/lib/db/expoSqliteDriver.ts`
- Create: `apps/mobile/src/lib/db/database.ts`
- Modify: `apps/mobile/package.json` (add `expo-crypto` via `npx expo install`)

- [ ] **Step 1: Install the native dep**

Run (from `apps/mobile`): `npx expo install expo-crypto`
Expected: adds `expo-crypto` to `package.json`.

- [ ] **Step 2: Write the driver adapter**

```ts
// apps/mobile/src/lib/db/expoSqliteDriver.ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { DbDriver, SqlParam } from '@med-history/core';

/** Adapts expo-sqlite's async API to core's DbDriver. */
export function makeExpoSqliteDriver(db: SQLiteDatabase): DbDriver {
  return {
    async exec(sql) {
      await db.execAsync(sql);
    },
    async run(sql, params: SqlParam[] = []) {
      await db.runAsync(sql, params);
    },
    async get<T>(sql: string, params: SqlParam[] = []) {
      return ((await db.getFirstAsync<T>(sql, params)) ?? undefined) as T | undefined;
    },
    async all<T>(sql: string, params: SqlParam[] = []) {
      return (await db.getAllAsync<T>(sql, params)) as T[];
    },
    async transaction<T>(fn: () => Promise<T>) {
      let result!: T;
      await db.withTransactionAsync(async () => {
        result = await fn();
      });
      return result;
    },
  };
}
```

> `@med-history/core` must export `DbDriver` and `SqlParam` — it already does (Task 13 of the core plan). If the import fails, confirm the core barrel exports them and STOP rather than re-declaring.

```ts
// apps/mobile/src/lib/db/database.ts
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { openDatabase, type Database } from '@med-history/core';
import { makeExpoSqliteDriver } from './expoSqliteDriver';

let dbPromise: Promise<Database> | null = null;

/** Opens the on-device DB once (runs migrations) and returns the core Database. */
export function getDatabase(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const sqlite = await SQLite.openDatabaseAsync('medhistory.db');
      const driver = makeExpoSqliteDriver(sqlite);
      return openDatabase(driver, {
        genId: () => Crypto.randomUUID(),
        now: () => new Date().toISOString(),
      });
    })();
  }
  return dbPromise;
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0. (If `expo-sqlite` types lack `getFirstAsync` generics, adjust the cast minimally.)

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/lib/db apps/mobile/package.json
git commit -m "feat(mobile): wire core to expo-sqlite via DbDriver adapter"
```

---

### Task 11: Mobile — settings repository + query layer

**Files:**
- Create: `apps/mobile/src/features/settings/repositories/settings.repository.ts`
- Create: `apps/mobile/src/features/settings/queryKeys.ts`
- Create: `apps/mobile/src/providers/QueryProvider.tsx`
- Modify: `apps/mobile/package.json` (`npx expo install @tanstack/react-query`)

- [ ] **Step 1: Install react-query**

Run (from `apps/mobile`): `npx expo install @tanstack/react-query`

- [ ] **Step 2: Implement**

```ts
// apps/mobile/src/features/settings/repositories/settings.repository.ts
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
```

```ts
// apps/mobile/src/features/settings/queryKeys.ts
export const settingsKeys = {
  all: ['settings'] as const,
};
```

```tsx
// apps/mobile/src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/settings/repositories apps/mobile/src/features/settings/queryKeys.ts apps/mobile/src/providers apps/mobile/package.json
git commit -m "feat(mobile): add settings repository and QueryProvider"
```

---

### Task 12: Mobile — settings hooks

**Files:**
- Create: `apps/mobile/src/features/settings/hooks/useSettings.hook.ts`
- Create: `apps/mobile/src/features/settings/hooks/useUpdateAppearance.hook.ts`

- [ ] **Step 1: Implement**

```ts
// apps/mobile/src/features/settings/hooks/useSettings.hook.ts
import { useQuery } from '@tanstack/react-query';
import { makeSettingsCoordinator } from '../services/coordinators/settings.coordinator';
import { settingsRepository } from '../repositories/settings.repository';
import { settingsKeys } from '../queryKeys';

const coordinator = makeSettingsCoordinator(settingsRepository);

export function useSettings() {
  const query = useQuery({
    queryKey: settingsKeys.all,
    queryFn: async () => {
      const r = await coordinator.load();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    staleTime: Infinity,
  });
  return {
    settings: query.data ?? null,
    loading: query.isLoading,
    error: query.isError ? (query.error as Error).message : null,
  };
}
```

```ts
// apps/mobile/src/features/settings/hooks/useUpdateAppearance.hook.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Theme } from '@med-history/core';
import type { SizeLevel } from '@/constants/appearance';
import { makeSettingsCoordinator } from '../services/coordinators/settings.coordinator';
import { settingsRepository } from '../repositories/settings.repository';
import { settingsKeys } from '../queryKeys';

const coordinator = makeSettingsCoordinator(settingsRepository);

export function useUpdateAppearance() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: { sizeLevel: SizeLevel; theme: Theme }) => {
      const r = await coordinator.commitOnboarding(input);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
  return {
    commitOnboarding: (input: { sizeLevel: SizeLevel; theme: Theme }) => mutation.mutateAsync(input),
    saving: mutation.isPending,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/settings/hooks
git commit -m "feat(mobile): add settings read/update hooks"
```

---

### Task 13: Mobile — AppearanceProvider + theme integration

**Files:**
- Create: `apps/mobile/src/features/settings/context/appearance.provider.tsx`
- Modify: `apps/mobile/src/constants/theme.ts` (extend `getTheme`)
- Modify: `apps/mobile/src/hooks/useTheme.hook.ts`

- [ ] **Step 1: Extend the theme**

Replace `getTheme` in `apps/mobile/src/constants/theme.ts` so it accepts a size level and adds `text` + `figureScale`. Add these imports at the top and update the `Theme` interface + `getTheme`:
```ts
import { scaleType, type TypeScale } from './typography';
import { figureScale as figureScaleFor, type SizeLevel } from './appearance';
```
Update the interface and function (keep existing `palette`, `spacing`, `radius`, `fonts`):
```ts
export interface Theme {
  scheme: ColorScheme;
  colors: Colors;
  spacing: typeof spacing;
  radius: typeof radius;
  fonts: typeof fonts;
  text: TypeScale;
  figureScale: number;
}

export function getTheme(scheme: ColorScheme, sizeLevel: SizeLevel = 1): Theme {
  return {
    scheme,
    colors: palette[scheme],
    spacing,
    radius,
    fonts,
    text: scaleType(sizeLevel),
    figureScale: figureScaleFor(sizeLevel),
  };
}
```

- [ ] **Step 2: Implement the provider**

```tsx
// apps/mobile/src/features/settings/context/appearance.provider.tsx
import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import {
  appearanceReducer,
  initialAppearance,
  resolveAppearance,
  type AppearanceState,
} from './appearanceReducer';
import type { Appearance, Scheme } from '../schemas/appearance';
import type { SizeLevel } from '@/constants/appearance';
import { useSettings } from '../hooks/useSettings.hook';

interface AppearanceContextValue {
  appearance: Appearance; // resolved (effective + preview)
  setPreview: (p: Partial<Appearance>) => void;
  clearPreview: () => void;
}

const Ctx = createContext<AppearanceContextValue | null>(null);
const DEFAULT: Appearance = { scheme: 'dark', sizeLevel: 1 };

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [state, dispatch] = useReducer(
    appearanceReducer,
    initialAppearance(DEFAULT) as AppearanceState,
  );

  // Sync persisted settings into the reducer's effective appearance.
  useEffect(() => {
    if (settings) {
      dispatch({
        type: 'setEffective',
        effective: { scheme: settings.theme as Scheme, sizeLevel: settings.sizeLevel as SizeLevel },
      });
    }
  }, [settings]);

  const value: AppearanceContextValue = {
    appearance: resolveAppearance(state),
    setPreview: (p) => dispatch({ type: 'setPreview', preview: p }),
    clearPreview: () => dispatch({ type: 'clearPreview' }),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppearance must be used within AppearanceProvider');
  return v;
}
```

- [ ] **Step 3: Point useTheme at the provider**

Replace `apps/mobile/src/hooks/useTheme.hook.ts`:
```ts
import { getTheme, type Theme } from '@/constants/theme';
import { useAppearance } from '@/features/settings/context/appearance.provider';

/** Resolved theme for the active appearance (persisted settings + any live preview). */
export function useTheme(): Theme {
  const { appearance } = useAppearance();
  return getTheme(appearance.scheme, appearance.sizeLevel);
}
```
(The old `useColorScheme.hook.ts` stays for any OS-scheme needs but is no longer used by `useTheme`.)

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/settings/context/appearance.provider.tsx apps/mobile/src/constants/theme.ts apps/mobile/src/hooks/useTheme.hook.ts
git commit -m "feat(mobile): add AppearanceProvider and size-aware theme"
```

---

### Task 14: Mobile — person figure + selector components

**Files:**
- Create: `apps/mobile/src/features/settings/components/personFigure.component.tsx`
- Create: `apps/mobile/src/features/settings/components/sizeSelector.component.tsx`
- Create: `apps/mobile/src/features/settings/components/themeSelector.component.tsx`

- [ ] **Step 1: Implement personFigure (simple silhouette via react-native-svg)**

```tsx
// apps/mobile/src/features/settings/components/personFigure.component.tsx
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme.hook';

// Base size 64; scales with the active theme's figureScale.
export function PersonFigure({ base = 64 }: { base?: number }) {
  const theme = useTheme();
  const size = Math.round(base * theme.figureScale);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={7} r={3.2} fill={theme.colors.textPrimary} />
      <Path d="M5 21c0-4 3-6.5 7-6.5S19 17 19 21" stroke={theme.colors.textPrimary} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}
```

- [ ] **Step 2: Implement sizeSelector**

```tsx
// apps/mobile/src/features/settings/components/sizeSelector.component.tsx
import { Pressable, Text, View } from 'react-native';
import { SIZE_LEVELS, SIZE_LABELS, type SizeLevel } from '@/constants/appearance';
import { useTheme } from '@/hooks/useTheme.hook';

export function SizeSelector({ value, onChange }: { value: SizeLevel; onChange: (l: SizeLevel) => void }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {SIZE_LEVELS.map((level) => {
        const selected = level === value;
        return (
          <Pressable
            key={level}
            onPress={() => onChange(level)}
            style={{
              padding: theme.spacing.md,
              borderRadius: theme.radius.md,
              borderWidth: 2,
              borderColor: selected ? theme.colors.accent : theme.colors.border,
              backgroundColor: selected ? theme.colors.bgSelected : theme.colors.bgElement,
            }}
          >
            <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.callout }}>
              {SIZE_LABELS[level]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 3: Implement themeSelector**

```tsx
// apps/mobile/src/features/settings/components/themeSelector.component.tsx
import { Pressable, Text, View } from 'react-native';
import type { Scheme } from '../schemas/appearance';
import { useTheme } from '@/hooks/useTheme.hook';

const OPTIONS: { value: Scheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeSelector({ value, onChange }: { value: Scheme; onChange: (s: Scheme) => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
      {OPTIONS.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.md,
              borderWidth: 2,
              borderColor: selected ? theme.colors.accent : theme.colors.border,
              backgroundColor: opt.value === 'dark' ? '#070b14' : '#ffffff',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: opt.value === 'dark' ? '#f5f7fa' : '#0b0f1a', fontSize: theme.text.callout }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/settings/components
git commit -m "feat(mobile): add person figure and size/theme selectors"
```

---

### Task 15: Mobile — onboarding screens

**Files:**
- Create: `apps/mobile/src/app/(onboarding)/_layout.tsx`
- Create: `apps/mobile/src/app/(onboarding)/size.tsx`
- Create: `apps/mobile/src/app/(onboarding)/theme.tsx`
- Create: `apps/mobile/src/app/(onboarding)/privacy.tsx`

- [ ] **Step 1: Stack layout**

```tsx
// apps/mobile/src/app/(onboarding)/_layout.tsx
import { Stack } from 'expo-router';
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Size step (live preview via setPreview)**

```tsx
// apps/mobile/src/app/(onboarding)/size.tsx
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '@/features/settings/context/appearance.provider';
import { SizeSelector } from '@/features/settings/components/sizeSelector.component';
import { PersonFigure } from '@/features/settings/components/personFigure.component';
import { useTheme } from '@/hooks/useTheme.hook';
import type { SizeLevel } from '@/constants/appearance';

export default function SizeStep() {
  const { appearance, setPreview } = useAppearance();
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgApp, padding: theme.spacing.lg }}>
      <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '600' }}>
        Choose a comfortable size
      </Text>
      <View style={{ alignItems: 'center', paddingVertical: theme.spacing.lg, gap: theme.spacing.sm }}>
        <PersonFigure />
        <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.body }}>
          Sample text scales with your choice.
        </Text>
      </View>
      <SizeSelector value={appearance.sizeLevel} onChange={(l: SizeLevel) => setPreview({ sizeLevel: l })} />
      <Pressable
        onPress={() => router.push('/(onboarding)/theme')}
        style={{ marginTop: theme.spacing.lg, padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.accent, alignItems: 'center' }}
      >
        <Text style={{ color: '#ffffff', fontSize: theme.text.callout, fontWeight: '600' }}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Theme step**

```tsx
// apps/mobile/src/app/(onboarding)/theme.tsx
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '@/features/settings/context/appearance.provider';
import { ThemeSelector } from '@/features/settings/components/themeSelector.component';
import { useTheme } from '@/hooks/useTheme.hook';
import type { Scheme } from '@/features/settings/schemas/appearance';

export default function ThemeStep() {
  const { appearance, setPreview } = useAppearance();
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgApp, padding: theme.spacing.lg }}>
      <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '600', marginBottom: theme.spacing.lg }}>
        Light or dark?
      </Text>
      <ThemeSelector value={appearance.scheme} onChange={(s: Scheme) => setPreview({ scheme: s })} />
      <View style={{ flex: 1 }} />
      <Pressable
        onPress={() => router.push('/(onboarding)/privacy')}
        style={{ padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.accent, alignItems: 'center' }}
      >
        <Text style={{ color: '#ffffff', fontSize: theme.text.callout, fontWeight: '600' }}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Privacy step (acknowledge → commit)**

```tsx
// apps/mobile/src/app/(onboarding)/privacy.tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '@/features/settings/context/appearance.provider';
import { useUpdateAppearance } from '@/features/settings/hooks/useUpdateAppearance.hook';
import { useTheme } from '@/hooks/useTheme.hook';

const PARAS = [
  'MedHistory stores everything you enter — profiles, visits, notes, prescriptions, and any documents — only on this device.',
  'There are no servers and no accounts. We cannot see, collect, or access your medical information, and neither can anyone else — not us, not a hospital, not an insurer — because it never leaves your phone.',
  'Because your records live only here, if you lose or reset this phone without a backup, they are permanently gone. We can’t recover them, because we never had them.',
  'A future update will let you export your data to a file and import it on another phone, so you can back it up or move it yourself, on your terms.',
];

export default function PrivacyStep() {
  const theme = useTheme();
  const { appearance, clearPreview } = useAppearance();
  const { commitOnboarding, saving } = useUpdateAppearance();
  const [ack, setAck] = useState(false);

  async function finish() {
    await commitOnboarding({ sizeLevel: appearance.sizeLevel, theme: appearance.scheme });
    clearPreview();
    router.replace('/');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgApp }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.largeTitle, fontWeight: '700' }}>
          Your data stays on this phone
        </Text>
        {PARAS.map((p, i) => (
          <Text key={i} style={{ color: theme.colors.textSecondary, fontSize: theme.text.body, lineHeight: theme.text.body * 1.4 }}>
            {p}
          </Text>
        ))}
        <Pressable onPress={() => setAck((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <View style={{ width: 24, height: 24, borderRadius: theme.radius.sm, borderWidth: 2, borderColor: theme.colors.accent, backgroundColor: ack ? theme.colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {ack && <Text style={{ color: '#ffffff' }}>✓</Text>}
          </View>
          <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.body, flex: 1 }}>
            I understand my data is stored only on this device.
          </Text>
        </Pressable>
      </ScrollView>
      <View style={{ padding: theme.spacing.lg }}>
        <Pressable
          disabled={!ack || saving}
          onPress={finish}
          style={{ padding: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center', backgroundColor: ack ? theme.colors.accent : theme.colors.bgSelected, opacity: saving ? 0.6 : 1 }}
        >
          <Text style={{ color: '#ffffff', fontSize: theme.text.callout, fontWeight: '600' }}>Get started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 5: Typecheck + commit**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit` (exit 0).
```bash
git add "apps/mobile/src/app/(onboarding)"
git commit -m "feat(mobile): add onboarding size/theme/privacy screens"
```

---

### Task 16: Mobile — root layout wiring + onboarding gate

**Files:**
- Modify: `apps/mobile/src/app/_layout.tsx`
- Modify: `apps/mobile/src/app/index.tsx` (use scaled theme text)

- [ ] **Step 1: Wire providers + gate**

```tsx
// apps/mobile/src/app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { QueryProvider } from '@/providers/QueryProvider';
import { AppearanceProvider } from '@/features/settings/context/appearance.provider';
import { useSettings } from '@/features/settings/hooks/useSettings.hook';
import { useTheme } from '@/hooks/useTheme.hook';

function Gate() {
  const { settings, loading } = useSettings();
  const segments = useSegments();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    if (loading || !settings) return;
    const inOnboarding = segments[0] === '(onboarding)';
    if (!settings.onboardingDone && !inOnboarding) {
      router.replace('/(onboarding)/size');
    } else if (settings.onboardingDone && inOnboarding) {
      router.replace('/');
    }
  }, [loading, settings, segments, router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AppearanceProvider>
        <Gate />
      </AppearanceProvider>
    </QueryProvider>
  );
}
```

- [ ] **Step 2: Update the placeholder home screen to use scaled text**

Replace the body of `apps/mobile/src/app/index.tsx`'s styles usage so the title uses `theme.text`. Update `index.styles.ts` `title`/`subtitle` to take sizes from the theme is optional; minimally, change `index.tsx` to inline the scaled sizes:
```tsx
// in apps/mobile/src/app/index.tsx, replace the two <Text> lines:
<Text style={[styles.title, { fontSize: theme.text.largeTitle }]}>MedHistory</Text>
<Text style={[styles.subtitle, { fontSize: theme.text.body }]}>You’re all set.</Text>
```
(Keep the rest of the file as-is; `theme` is already in scope via `useTheme()`.)

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0. Run all pure tests too: `pnpm --filter @med-history/mobile test` (green).

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/app/_layout.tsx apps/mobile/src/app/index.tsx
git commit -m "feat(mobile): wire providers and onboarding gate"
```

---

### Task 17: On-device verification (manual)

**Files:** none (verification only).

- [ ] **Step 1: Start the app**

Run (from `apps/mobile`): `npx expo start -c`. Open in Expo Go (SDK 54) on the device.

- [ ] **Step 2: Verify the flow** (check each):
  - First launch lands on the **Size** step (onboarding gate works).
  - Tapping size options scales the sample text **and** the person figure live.
  - **Theme** step switches light/dark live; Dark is pre-selected.
  - **Privacy** step shows the full statement; **Get started** is disabled until the checkbox is ticked.
  - Tapping **Get started** lands on the home screen at the chosen size/theme.
  - **Fully close and relaunch** the app → it skips onboarding and opens the home screen directly (persisted `onboarding_done`).

- [ ] **Step 3: If all pass, record completion**

```bash
git commit --allow-empty -m "test(mobile): verified onboarding flow on device (SDK 54)"
```

(If something fails, capture the error and treat it as a bug to fix in the relevant task before considering the plan complete.)

---

## Self-review

**Spec coverage:**
- Theme persisted (migration 2 + setTheme + barrel) → Tasks 1–3. ✓
- Size levels + multipliers + typography scale → Tasks 6–7. ✓
- `getTheme(scheme, sizeLevel)` → `text` + `figureScale` → Task 13. ✓
- AppearanceProvider (effective + preview override), `useTheme` on it → Tasks 8, 13. ✓
- expo-sqlite driver + getDatabase + QueryProvider → Tasks 10–11. ✓
- features/settings repo/coordinator/hooks → Tasks 9, 11, 12. ✓
- 3-step flow (Size live preview, Theme, Privacy acknowledge→commit) → Task 15. ✓
- Onboarding gate on `onboarding_done` → Task 16. ✓
- Privacy copy verbatim → Task 15. ✓
- Person silhouette in preview → Task 14. ✓

**Placeholder scan:** No TBD/“add error handling” placeholders; every code step is complete. UI tasks explicitly state typecheck-only verification (no simulator), with on-device manual checks consolidated in Task 17 — this is a real constraint, not a placeholder gap.

**Type consistency:** `SizeLevel` (from `constants/appearance`), `Scheme`/`Appearance` (settings schemas), `Theme` (core enum), `Result<T>`/`ok`/`err`, `SettingsPort`, `makeSettingsCoordinator`, `getDatabase`, `useTheme`/`useAppearance`, `getTheme(scheme, sizeLevel)` with `text`/`figureScale` — names are consistent across tasks. The coordinator’s `commitOnboarding` (Task 9) matches the hook (Task 12) and the privacy screen call (Task 15).

## Note (next plan)
A Settings screen to change size/theme after onboarding reuses `SizeSelector`/`ThemeSelector` + `setSizeLevel`/`setTheme` (already on the coordinator/repo — only `commitOnboarding` is wired so far; add per-field mutations when that screen is built).
