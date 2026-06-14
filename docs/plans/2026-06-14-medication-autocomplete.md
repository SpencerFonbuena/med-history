# Prescription Medication Autocomplete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a prescription entry search a bundled 27k-product drug catalog in a full-screen modal and store the picked product's `rxcui` (+ strength/dose form), with a free-text fallback.

**Architecture:** Core gains a `buildFtsQuery` helper, an `m3` migration creating a `medications` FTS5 table, and a `medications` repository (`count`/`seed`/`search`). A new `features/medications` loads the bundled JSON asset and seeds the table lazily on first search, then queries it. The entries prescription form replaces its Title field with a Medication field that opens an in-component `<Modal>` and writes the selection into the entry's `details`.

**Tech Stack:** TypeScript, packages/core (SQLite FTS5, better-sqlite3 tests), Expo SDK 54 (React Native `<Modal>`), @tanstack/react-query v5, vitest.

**Branch:** `feat/medication-autocomplete` (off `main`). Spec: `docs/specs/2026-06-14-medication-autocomplete-design.md`.

**Verification note:** Tasks 1–3 (core) test with `pnpm --filter @med-history/core test`; Task 6 and 9 (mobile pure logic) with `pnpm --filter @med-history/mobile test`. Tasks 4–5, 7–8, 10–11 are RN/Expo and verify with `pnpm --filter @med-history/mobile exec tsc --noEmit` only (no simulator); runtime + FTS5-on-device is checked in Task 12. Route/asset specifics noted per task.

---

## File structure

```
packages/core/src/
  db/ftsQuery.ts                                  # buildFtsQuery (pure)
  db/migrations/m3-medications.ts                 # FTS5 table
  db/migrations/index.ts                          # + m3
  repositories/medications.repository.ts          # count/seed/search
  db/database.ts                                  # + medications in Database
  index.ts                                        # + exports
apps/mobile/
  assets/data/medications.json                    # bundled, trimmed catalog (~27k rows)
  src/features/medications/
    schemas/medication.ts                          # MedicationSelection union; re-export MedicationHit
    repositories/medicationCatalog.repository.ts    # MedicationPort: count/seed/search + loadCatalog (require asset)
    services/coordinators/medicationSearch.coordinator.ts        # ensureSeeded/search
    services/coordinators/medicationSearch.coordinator.instance.ts
    queryKeys.ts
    hooks/useDebouncedValue.hook.ts
    hooks/useMedicationSearch.hook.ts
    components/medicationSearchResult.component.tsx + .styles.ts
    components/medicationSearchModal.component.tsx + .styles.ts
  src/features/entries/
    schemas/medicationDetails.ts                    # MedicationDetails type
    services/providers/entryTypes.provider.ts       # + medication arg in builders, + entryMeta strength
    components/entryForm.component.tsx              # prescription Medication field + modal
    containers/newEntry.container.tsx               # pass medication
    containers/editEntry.container.tsx              # prefill + pass medication
```

---

### Task 1: core — buildFtsQuery

**Files:**
- Create: `packages/core/src/db/ftsQuery.ts`
- Test: `packages/core/src/db/ftsQuery.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/db/ftsQuery.test.ts
import { describe, it, expect } from 'vitest';
import { buildFtsQuery } from './ftsQuery';

describe('buildFtsQuery', () => {
  it('lowercases and prefixes each token, AND-ed', () => {
    expect(buildFtsQuery('Lisin 10')).toBe('lisin* 10*');
  });
  it('splits on punctuation as well as spaces', () => {
    expect(buildFtsQuery('amox/clav')).toBe('amox* clav*');
  });
  it('returns empty string for blank input', () => {
    expect(buildFtsQuery('   ')).toBe('');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @med-history/core test src/db/ftsQuery.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// packages/core/src/db/ftsQuery.ts

/** Turn raw user text into an FTS5 prefix MATCH query: alnum tokens, each a prefix, AND-ed. */
export function buildFtsQuery(input: string): string {
  const tokens = input.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return '';
  return tokens.map((t) => `${t}*`).join(' ');
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @med-history/core test src/db/ftsQuery.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/db/ftsQuery.ts packages/core/src/db/ftsQuery.test.ts
git commit -m "feat(core): add buildFtsQuery prefix-match helper"
```

---

### Task 2: core — m3 medications migration

**Files:**
- Create: `packages/core/src/db/migrations/m3-medications.ts`
- Modify: `packages/core/src/db/migrations/index.ts`
- Test: `packages/core/src/db/migrate.test.ts` (the existing version test will need the new highest version)

- [ ] **Step 1: Create the migration**

```ts
// packages/core/src/db/migrations/m3-medications.ts
import type { Migration } from '../migrate';

export const m3Medications: Migration = {
  version: 3,
  up: async (d) => {
    await d.exec(
      `CREATE VIRTUAL TABLE medications USING fts5(
        name, rxcui UNINDEXED, type UNINDEXED, brand UNINDEXED,
        strength UNINDEXED, doseForm UNINDEXED, tokenize='porter unicode61'
      )`,
    );
  },
};
```

- [ ] **Step 2: Register it** in `packages/core/src/db/migrations/index.ts`:

```ts
import type { Migration } from '../migrate';
import { m1Initial } from './m1-initial';
import { m2Theme } from './m2-theme';
import { m3Medications } from './m3-medications';

export const migrations: Migration[] = [m1Initial, m2Theme, m3Medications];
```

- [ ] **Step 3: Verify the migration applies** — run the existing migration/db test suites:

Run: `pnpm --filter @med-history/core test src/db/migrate.test.ts src/db/database.test.ts src/db/migrations/m1-initial.test.ts`
Expected: PASS. (These exercise the runner against `migrations` from `./migrations/index`, so the new table is created and `user_version` advances to 3. If any test asserts a specific top `user_version` number — e.g. the m1 test — and now fails because the version advanced, that is expected: such a test that hard-codes the latest version should read the count from `migrations.length` or expect `3`. Update only that assertion, nothing else.)

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/db/migrations/m3-medications.ts packages/core/src/db/migrations/index.ts packages/core/src/db/migrate.test.ts
git commit -m "feat(core): add m3 migration creating medications FTS5 table"
```

---

### Task 3: core — medications repository

**Files:**
- Create: `packages/core/src/repositories/medications.repository.ts`
- Modify: `packages/core/src/db/database.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/repositories/medications.repository.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/repositories/medications.repository.test.ts
import { describe, it, expect } from 'vitest';
import { makeTestDb } from '../test/makeTestDb';
import type { MedicationSeedRow } from './medications.repository';

const rows: MedicationSeedRow[] = [
  { rxcui: '1', name: 'Lisinopril 10 MG Oral Tablet', type: 'generic', strength: '10 MG', doseForm: 'Oral Tablet' },
  { rxcui: '2', name: 'Lisinopril 20 MG Oral Tablet', type: 'generic', strength: '20 MG', doseForm: 'Oral Tablet' },
  { rxcui: '3', name: 'Amoxicillin 500 MG Oral Capsule', type: 'generic', strength: '500 MG', doseForm: 'Oral Capsule' },
];

describe('medications repository', () => {
  it('seeds then searches by prefix and ANDs terms', async () => {
    const { db } = await makeTestDb();
    await db.medications.seed(rows);
    expect(await db.medications.count()).toBe(3);
    const hits = await db.medications.search('lisin 10');
    expect(hits).toHaveLength(1);
    expect(hits[0].rxcui).toBe('1');
    expect(hits[0].strength).toBe('10 MG');
  });

  it('matches all products for a single prefix', async () => {
    const { db } = await makeTestDb();
    await db.medications.seed(rows);
    const hits = await db.medications.search('lisin');
    expect(hits.map((h) => h.rxcui).sort()).toEqual(['1', '2']);
  });

  it('is idempotent — a second seed does not duplicate', async () => {
    const { db } = await makeTestDb();
    await db.medications.seed(rows);
    await db.medications.seed(rows);
    expect(await db.medications.count()).toBe(3);
  });

  it('returns [] for a blank query', async () => {
    const { db } = await makeTestDb();
    await db.medications.seed(rows);
    expect(await db.medications.search('   ')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @med-history/core test src/repositories/medications.repository.test.ts`
Expected: FAIL — `db.medications` is undefined / module not found.

- [ ] **Step 3: Implement the repository**

```ts
// packages/core/src/repositories/medications.repository.ts
import type { DbDriver, SqlParam } from '../db/driver';
import { buildFtsQuery } from '../db/ftsQuery';

export interface MedicationSeedRow {
  rxcui: string;
  name: string;
  type: string;
  brand?: string;
  strength?: string;
  doseForm?: string;
}

export interface MedicationHit {
  rxcui: string;
  name: string;
  strength?: string;
  doseForm?: string;
}

interface HitRow {
  rxcui: string;
  name: string;
  strength: string | null;
  doseForm: string | null;
}

const CHUNK = 400;

export function makeMedicationsRepository(driver: DbDriver) {
  async function count(): Promise<number> {
    const row = await driver.get<{ c: number }>('SELECT count(*) AS c FROM medications');
    return row?.c ?? 0;
  }

  async function seed(rows: MedicationSeedRow[]): Promise<void> {
    if ((await count()) > 0) return;
    await driver.transaction(async () => {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const values = slice.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
        const params: SqlParam[] = [];
        for (const r of slice) {
          params.push(r.name, r.rxcui, r.type, r.brand ?? null, r.strength ?? null, r.doseForm ?? null);
        }
        await driver.run(
          `INSERT INTO medications (name, rxcui, type, brand, strength, doseForm) VALUES ${values}`,
          params,
        );
      }
    });
  }

  async function search(query: string, limit = 30): Promise<MedicationHit[]> {
    const match = buildFtsQuery(query);
    if (!match) return [];
    const found = await driver.all<HitRow>(
      'SELECT rxcui, name, strength, doseForm FROM medications WHERE medications MATCH ? ORDER BY rank LIMIT ?',
      [match, limit],
    );
    return found.map((r) => ({
      rxcui: r.rxcui,
      name: r.name,
      strength: r.strength ?? undefined,
      doseForm: r.doseForm ?? undefined,
    }));
  }

  return { count, seed, search };
}
```

- [ ] **Step 4: Wire it into `Database`** — in `packages/core/src/db/database.ts` add the import, the interface field, and the construction:

```ts
import { makeMedicationsRepository } from '../repositories/medications.repository';
```
Add to the `Database` interface (after `attachments`):
```ts
  medications: ReturnType<typeof makeMedicationsRepository>;
```
Add to the returned object (after `attachments`):
```ts
    medications: makeMedicationsRepository(driver),
```

- [ ] **Step 5: Export from `packages/core/src/index.ts`** — add:
```ts
export { makeMedicationsRepository, type MedicationHit, type MedicationSeedRow } from './repositories/medications.repository';
export { buildFtsQuery } from './db/ftsQuery';
```

- [ ] **Step 6: Run to verify it passes**

Run: `pnpm --filter @med-history/core test src/repositories/medications.repository.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/repositories/medications.repository.ts packages/core/src/repositories/medications.repository.test.ts packages/core/src/db/database.ts packages/core/src/index.ts
git commit -m "feat(core): add medications repository (count/seed/search over FTS5)"
```

---

> **Tasks 4–5, 7–8, 10–11 are RN/Expo: verify with `tsc --noEmit` only. Do not claim runtime success.**

### Task 4: bundled catalog asset (trim + commit)

**Files:**
- Create: `apps/mobile/assets/data/medications.json` (generated)

- [ ] **Step 1: Produce the trimmed asset from the staged catalog**

Run (from the repo root):
```bash
mkdir -p apps/mobile/assets/data
python3 -c "import json; d=json.load(open('/private/tmp/rxnav/medications.json')); out=[{k:m[k] for k in ('rxcui','name','type','brand','strength','doseForm') if k in m} for m in d]; json.dump(out, open('apps/mobile/assets/data/medications.json','w'), ensure_ascii=False, separators=(',',':'))"
```

- [ ] **Step 2: Sanity-check the output**

Run:
```bash
python3 -c "import json; d=json.load(open('apps/mobile/assets/data/medications.json')); print('rows', len(d)); print('keys', sorted(d[0].keys())); print('sample', d[0])"
ls -lh apps/mobile/assets/data/medications.json
```
Expected: ~27,258 rows; keys a subset of `['brand','doseForm','name','rxcui','strength','type']`; file noticeably smaller than the 7MB source.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/assets/data/medications.json
git commit -m "feat(mobile): bundle trimmed medication catalog asset"
```

---

### Task 5: medication schema + catalog repository

**Files:**
- Create: `apps/mobile/src/features/medications/schemas/medication.ts`
- Create: `apps/mobile/src/features/medications/repositories/medicationCatalog.repository.ts`

> The repository loads the bundled asset with a **lazy `require`** so the ~5MB JSON is parsed only
> on the first-ever seed (not on every app launch), and exposes the core-backed port methods.

- [ ] **Step 1: Create the schema**

```ts
// apps/mobile/src/features/medications/schemas/medication.ts
import type { MedicationHit } from '@med-history/core';

export type { MedicationHit };

/** What the search modal hands back: a catalog product or raw typed text. */
export type MedicationSelection =
  | { kind: 'catalog'; rxcui: string; name: string; strength?: string; doseForm?: string }
  | { kind: 'freeText'; name: string };
```

- [ ] **Step 2: Create the repository**

```ts
// apps/mobile/src/features/medications/repositories/medicationCatalog.repository.ts
import { getDatabase } from '@/lib/db/database';
import type { MedicationSeedRow, MedicationHit } from '@med-history/core';

/** The slice of the catalog the search coordinator drives. */
export interface MedicationPort {
  count(): Promise<number>;
  seed(rows: MedicationSeedRow[]): Promise<void>;
  search(query: string): Promise<MedicationHit[]>;
  loadCatalog(): Promise<MedicationSeedRow[]>;
}

export const medicationCatalogRepository: MedicationPort = {
  async count() {
    return (await getDatabase()).medications.count();
  },
  async seed(rows) {
    return (await getDatabase()).medications.seed(rows);
  },
  async search(query) {
    return (await getDatabase()).medications.search(query);
  },
  async loadCatalog() {
    // Lazy require: the ~5MB asset is parsed only when this runs (first-ever seed), never after.
    return require('../../../../assets/data/medications.json') as MedicationSeedRow[];
  },
};
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0. (If tsc cannot find `require`: this Expo project uses asset `require`s already; if it errors, add `// @ts-expect-error metro require` above the require line — do not change the load strategy.)

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/medications/schemas apps/mobile/src/features/medications/repositories
git commit -m "feat(mobile): add medication selection schema and catalog repository"
```

---

### Task 6: medication search coordinator

**Files:**
- Create: `apps/mobile/src/features/medications/services/coordinators/medicationSearch.coordinator.ts`
- Create: `apps/mobile/src/features/medications/services/coordinators/medicationSearch.coordinator.instance.ts`
- Create: `apps/mobile/src/features/medications/queryKeys.ts`
- Test: `apps/mobile/src/features/medications/services/coordinators/medicationSearch.coordinator.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/features/medications/services/coordinators/medicationSearch.coordinator.test.ts
import { describe, it, expect } from 'vitest';
import { makeMedicationSearchCoordinator } from './medicationSearch.coordinator';
import type { MedicationPort } from '../../repositories/medicationCatalog.repository';

function fakePort(over: Partial<MedicationPort> = {}): MedicationPort {
  let rows = 0;
  return {
    count: async () => rows,
    seed: async (r) => { rows = r.length; },
    search: async () => [{ rxcui: '1', name: 'Lisinopril 10 MG Oral Tablet' }],
    loadCatalog: async () => [{ rxcui: '1', name: 'Lisinopril 10 MG Oral Tablet', type: 'generic' }],
    ...over,
  };
}

describe('medication search coordinator', () => {
  it('seeds once when empty, then is a no-op', async () => {
    let loads = 0;
    const port = fakePort({ loadCatalog: async () => { loads++; return [{ rxcui: '1', name: 'A', type: 'generic' }]; } });
    const c = makeMedicationSearchCoordinator(port);
    await c.ensureSeeded();
    await c.ensureSeeded();
    expect(loads).toBe(1);
  });

  it('searches via the port', async () => {
    const c = makeMedicationSearchCoordinator(fakePort());
    const r = await c.search('lisin');
    expect(r.ok && r.data[0].rxcui).toBe('1');
  });

  it('wraps thrown errors as err', async () => {
    const c = makeMedicationSearchCoordinator(fakePort({ search: async () => { throw new Error('boom'); } }));
    expect((await c.search('x')).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @med-history/mobile test src/features/medications/services/coordinators/medicationSearch.coordinator.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// apps/mobile/src/features/medications/services/coordinators/medicationSearch.coordinator.ts
import type { MedicationHit } from '@med-history/core';
import { ok, err, type Result } from '@/lib/result';
import type { MedicationPort } from '../../repositories/medicationCatalog.repository';

export function makeMedicationSearchCoordinator(port: MedicationPort) {
  async function ensureSeeded(): Promise<Result<void>> {
    try {
      if ((await port.count()) > 0) return ok(undefined);
      const rows = await port.loadCatalog();
      await port.seed(rows);
      return ok(undefined);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function search(query: string): Promise<Result<MedicationHit[]>> {
    try {
      return ok(await port.search(query));
    } catch (e) {
      return err((e as Error).message);
    }
  }

  return { ensureSeeded, search };
}
```

```ts
// apps/mobile/src/features/medications/services/coordinators/medicationSearch.coordinator.instance.ts
import { makeMedicationSearchCoordinator } from './medicationSearch.coordinator';
import { medicationCatalogRepository } from '../../repositories/medicationCatalog.repository';

export const medicationSearchCoordinator = makeMedicationSearchCoordinator(medicationCatalogRepository);
```

```ts
// apps/mobile/src/features/medications/queryKeys.ts
export const medicationKeys = {
  all: ['medications'] as const,
  seed: ['medications', 'seed'] as const,
  search: (query: string) => ['medications', 'search', query] as const,
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @med-history/mobile test src/features/medications/services/coordinators/medicationSearch.coordinator.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/medications/services apps/mobile/src/features/medications/queryKeys.ts
git commit -m "feat(mobile): add medication search coordinator and query keys"
```

---

### Task 7: debounce + search hooks

**Files:**
- Create: `apps/mobile/src/features/medications/hooks/useDebouncedValue.hook.ts`
- Create: `apps/mobile/src/features/medications/hooks/useMedicationSearch.hook.ts`

- [ ] **Step 1: Implement the debounce hook**

```ts
// apps/mobile/src/features/medications/hooks/useDebouncedValue.hook.ts
import { useEffect, useState } from 'react';

/** Returns `value` delayed by `delayMs`, resetting the timer on each change. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
```

- [ ] **Step 2: Implement the search hook**

```ts
// apps/mobile/src/features/medications/hooks/useMedicationSearch.hook.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { medicationSearchCoordinator } from '../services/coordinators/medicationSearch.coordinator.instance';
import { medicationKeys } from '../queryKeys';
import { useDebouncedValue } from './useDebouncedValue.hook';

export function useMedicationSearch(query: string) {
  const seed = useQuery({
    queryKey: medicationKeys.seed,
    queryFn: async () => {
      const r = await medicationSearchCoordinator.ensureSeeded();
      if (!r.ok) throw new Error(r.error);
      return true;
    },
    staleTime: Infinity,
  });

  const debounced = useDebouncedValue(query, 200);

  const results = useQuery({
    queryKey: medicationKeys.search(debounced),
    queryFn: async () => {
      const r = await medicationSearchCoordinator.search(debounced);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    enabled: seed.isSuccess && debounced.trim().length > 0,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });

  return {
    results: results.data ?? [],
    seeding: seed.isLoading,
    searching: results.isFetching,
    error: seed.isError ? (seed.error as Error).message : results.isError ? (results.error as Error).message : null,
  };
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/medications/hooks
git commit -m "feat(mobile): add debounce and medication search hooks"
```

---

### Task 8: search result + search modal components

**Files:**
- Create: `apps/mobile/src/features/medications/components/medicationSearchResult.component.tsx` + `.styles.ts`
- Create: `apps/mobile/src/features/medications/components/medicationSearchModal.component.tsx` + `.styles.ts`

> The product `name` already includes strength + dose form, so the result row shows just the name.
> No hardcoded hex — use theme tokens.

- [ ] **Step 1: Implement the result row**

```ts
// apps/mobile/src/features/medications/components/medicationSearchResult.styles.ts
import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeMedicationSearchResultStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.borderSubtle },
    name: { color: theme.colors.textPrimary, fontSize: theme.text.body },
  });
```

```tsx
// apps/mobile/src/features/medications/components/medicationSearchResult.component.tsx
import { Pressable, Text } from 'react-native';
import type { MedicationHit } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { makeMedicationSearchResultStyles } from './medicationSearchResult.styles';

export function MedicationSearchResult({ hit, onPress }: { hit: MedicationHit; onPress: () => void }) {
  const theme = useTheme();
  const styles = makeMedicationSearchResultStyles(theme);
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.name}>{hit.name}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: Implement the modal**

```ts
// apps/mobile/src/features/medications/components/medicationSearchModal.styles.ts
import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeMedicationSearchModalStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.bgApp },
    header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
    cancel: { color: theme.colors.accent, fontSize: theme.text.body },
    input: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.sm, color: theme.colors.textPrimary, fontSize: theme.text.body },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm },
    hint: { color: theme.colors.textSecondary, fontSize: theme.text.footnote },
    freeText: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.borderSubtle },
    freeTextLabel: { color: theme.colors.accent, fontSize: theme.text.body, fontWeight: '600' },
  });
```

```tsx
// apps/mobile/src/features/medications/components/medicationSearchModal.component.tsx
import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme.hook';
import { useMedicationSearch } from '../hooks/useMedicationSearch.hook';
import { MedicationSearchResult } from './medicationSearchResult.component';
import { makeMedicationSearchModalStyles } from './medicationSearchModal.styles';
import type { MedicationSelection } from '../schemas/medication';

export function MedicationSearchModal({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (selection: MedicationSelection) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const styles = makeMedicationSearchModalStyles(theme);
  const [query, setQuery] = useState('');
  const { results, seeding } = useMedicationSearch(query);
  const trimmed = query.trim();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search medications"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
          />
        </View>
        {seeding ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.hint}>Preparing medication list…</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(m) => m.rxcui}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              trimmed.length > 0 ? (
                <Pressable onPress={() => onSelect({ kind: 'freeText', name: trimmed })} style={styles.freeText}>
                  <Text style={styles.freeTextLabel}>Use "{trimmed}"</Text>
                </Pressable>
              ) : null
            }
            renderItem={({ item }) => (
              <MedicationSearchResult
                hit={item}
                onPress={() => onSelect({ kind: 'catalog', rxcui: item.rxcui, name: item.name, strength: item.strength, doseForm: item.doseForm })}
              />
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/medications/components
git commit -m "feat(mobile): add medication search result and full-screen search modal"
```

---

### Task 9: entries — medication details in builders + meta

**Files:**
- Create: `apps/mobile/src/features/entries/schemas/medicationDetails.ts`
- Modify: `apps/mobile/src/features/entries/services/providers/entryTypes.provider.ts`
- Test: `apps/mobile/src/features/entries/services/providers/entryTypes.provider.test.ts`

- [ ] **Step 1: Add the failing tests** — APPEND these inside the existing `describe('entryTypes provider', ...)` block in `entryTypes.provider.test.ts`:

```ts
  it('attaches medication details to a create input', () => {
    const r = buildCreateInput(
      'p', null, 'prescription',
      { date: '2026-01-01', title: 'Lisinopril 10 MG Oral Tablet', body: 'x' },
      { rxcui: '12345', strength: '10 MG', doseForm: 'Oral Tablet' },
    );
    expect(r.details).toEqual({ rxcui: '12345', strength: '10 MG', doseForm: 'Oral Tablet' });
  });
  it('omits details when no medication is given', () => {
    const r = buildCreateInput('p', null, 'prescription', { date: '2026-01-01', title: 'x', body: 'y' });
    expect(r.details).toBeUndefined();
  });
  it('attaches medication details on update too', () => {
    const u = buildUpdateInput('prescription', { date: '2026-01-01', title: 'T', body: 'B' }, { rxcui: '9' });
    expect(u.details).toEqual({ rxcui: '9' });
  });
  it('entryMeta surfaces the strength from details', () => {
    const e = { details: { rxcui: '1', strength: '10 MG' } } as unknown as import('@med-history/core').Entry;
    expect(entryMeta(e)).toContainEqual({ label: 'Strength:', value: '10 MG' });
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @med-history/mobile test src/features/entries/services/providers/entryTypes.provider.test.ts`
Expected: FAIL — `buildCreateInput` takes too few args / `details` undefined.

- [ ] **Step 3: Create the MedicationDetails type**

```ts
// apps/mobile/src/features/entries/schemas/medicationDetails.ts

/** The catalog linkage stored in an entry's `details` JSON for prescriptions. */
export interface MedicationDetails {
  rxcui: string;
  strength?: string;
  doseForm?: string;
}
```

- [ ] **Step 4: Update the provider** — in `entryTypes.provider.ts`:

Add the import at the top:
```ts
import type { MedicationDetails } from '../../schemas/medicationDetails';
```

Add this helper near `cleanExtras`:
```ts
function medicationToDetails(med: MedicationDetails): Record<string, unknown> {
  return {
    rxcui: med.rxcui,
    ...(med.strength ? { strength: med.strength } : {}),
    ...(med.doseForm ? { doseForm: med.doseForm } : {}),
  };
}
```

Change `buildCreateInput` to accept and apply the optional medication:
```ts
export function buildCreateInput(
  profileId: string,
  regionCode: string | null,
  type: EntryType,
  values: EntryFormValues,
  medication?: MedicationDetails,
): CreateEntryInput {
  return {
    profileId,
    regionCode,
    type,
    date: values.date,
    title: values.title.trim(),
    body: values.body.trim(),
    ...cleanExtras(values),
    ...(type === 'imaging_test' && values.subtype ? { subtype: values.subtype } : {}),
    ...(medication ? { details: medicationToDetails(medication) } : {}),
  };
}
```

Change `buildUpdateInput` likewise:
```ts
export function buildUpdateInput(
  type: EntryType,
  values: EntryFormValues,
  medication?: MedicationDetails,
): UpdateEntryInput {
  return {
    date: values.date,
    title: values.title.trim(),
    body: values.body.trim(),
    ...cleanExtras(values),
    ...(type === 'imaging_test' && values.subtype ? { subtype: values.subtype } : {}),
    ...(medication ? { details: medicationToDetails(medication) } : {}),
  };
}
```

Add the strength line in `entryMeta` — just before the final `return meta;`:
```ts
  const strength = entry.details && (entry.details as Record<string, unknown>).strength;
  if (typeof strength === 'string') meta.push({ label: 'Strength:', value: strength });
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm --filter @med-history/mobile test src/features/entries/services/providers/entryTypes.provider.test.ts`
Expected: PASS (existing tests + the 4 new ones).

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/features/entries/schemas/medicationDetails.ts apps/mobile/src/features/entries/services/providers/entryTypes.provider.ts apps/mobile/src/features/entries/services/providers/entryTypes.provider.test.ts
git commit -m "feat(mobile): thread medication details through entry input builders and meta"
```

---

### Task 10: entry form — prescription medication field

**Files:**
- Modify: `apps/mobile/src/features/entries/components/entryForm.component.tsx`
- Modify: `apps/mobile/src/features/entries/components/entryForm.styles.ts`

> For `type === 'prescription'`, replace the Title `TextInput` with a tappable Medication field that
> opens the `MedicationSearchModal`. The form's `onSubmit` gains a second `medication` argument.

- [ ] **Step 1: Add styles** — append to the `StyleSheet.create({...})` in `entryForm.styles.ts`:

```ts
    medField: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.sm },
    medValue: { fontSize: theme.text.body },
```

- [ ] **Step 2: Update the component** — `entryForm.component.tsx`:

Add imports:
```ts
import { MedicationSearchModal } from '@/features/medications/components/medicationSearchModal.component';
import type { MedicationDetails } from '../schemas/medicationDetails';
```

Change the props type and signature to add `initialMedication` and the second `onSubmit` arg:
```tsx
export function EntryForm({
  type,
  initial,
  initialMedication,
  submitting,
  onSubmit,
  onDelete,
}: {
  type: EntryType;
  initial?: Partial<EntryFormValues>;
  initialMedication?: MedicationDetails;
  submitting: boolean;
  onSubmit: (values: EntryFormValues, medication?: MedicationDetails) => void;
  onDelete?: () => void;
}) {
```

Add state (next to the other `useState`s):
```tsx
  const [medication, setMedication] = useState<MedicationDetails | null>(initialMedication ?? null);
  const [medSearchVisible, setMedSearchVisible] = useState(false);
```

Change `submit()` to pass the medication for prescriptions:
```tsx
    setError(null);
    onSubmit(parsed.data, type === 'prescription' ? (medication ?? undefined) : undefined);
```

Replace the existing Title field block:
```tsx
      <View>
        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Short headline"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.field, styles.fieldText]}
        />
      </View>
```
with a conditional Title-vs-Medication block:
```tsx
      {type === 'prescription' ? (
        <View>
          <Text style={styles.fieldLabel}>Medication</Text>
          <Pressable onPress={() => setMedSearchVisible(true)} style={styles.medField}>
            <Text style={[styles.medValue, { color: title ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
              {title || 'Select medication'}
            </Text>
          </Pressable>
          <MedicationSearchModal
            visible={medSearchVisible}
            onClose={() => setMedSearchVisible(false)}
            onSelect={(sel) => {
              setTitle(sel.name);
              setMedication(sel.kind === 'catalog' ? { rxcui: sel.rxcui, strength: sel.strength, doseForm: sel.doseForm } : null);
              setMedSearchVisible(false);
            }}
          />
        </View>
      ) : (
        <View>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Short headline"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.field, styles.fieldText]}
          />
        </View>
      )}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/entries/components/entryForm.component.tsx apps/mobile/src/features/entries/components/entryForm.styles.ts
git commit -m "feat(mobile): add prescription medication field to the entry form"
```

---

### Task 11: wire medication through the entry containers

**Files:**
- Modify: `apps/mobile/src/features/entries/containers/newEntry.container.tsx`
- Modify: `apps/mobile/src/features/entries/containers/editEntry.container.tsx`

- [ ] **Step 1: New-entry container** — change the `onSubmit` to forward the medication:

In `newEntry.container.tsx`, replace the `<EntryForm ... onSubmit={...} />` so the handler is:
```tsx
        <EntryForm
          type={type}
          submitting={saving}
          onSubmit={async (values, medication) => {
            await createEntry(buildCreateInput(id ?? '', regionParamToCode(code ?? ''), type, values, medication));
            router.back();
          }}
        />
```

- [ ] **Step 2: Edit-entry container** — prefill the medication from the entry's details and forward it.

In `editEntry.container.tsx`, add this just after `const profile = ...`/the entry is resolved (after the `if (loading || !entry)` guard, before `return`):
```tsx
  const initialMedication =
    entry.details && typeof (entry.details as Record<string, unknown>).rxcui === 'string'
      ? {
          rxcui: (entry.details as Record<string, unknown>).rxcui as string,
          strength: (entry.details as Record<string, unknown>).strength as string | undefined,
          doseForm: (entry.details as Record<string, unknown>).doseForm as string | undefined,
        }
      : undefined;
```

Pass it and forward the medication on submit — update the `<EntryForm .../>` usage:
```tsx
        <EntryForm
          type={entry.type}
          initial={{
            date: entry.date,
            title: entry.title,
            body: entry.body,
            doctor: entry.doctor ?? undefined,
            diagnosis: entry.diagnosis ?? undefined,
            prescriber: entry.prescriber ?? undefined,
            duration: entry.duration ?? undefined,
            facility: entry.facility ?? undefined,
            subtype: entry.subtype ?? undefined,
          }}
          initialMedication={initialMedication}
          submitting={saving}
          onSubmit={async (values, medication) => {
            await updateEntry(entry.id, buildUpdateInput(entry.type, values, medication));
            router.back();
          }}
          onDelete={confirmDelete}
        />
```

- [ ] **Step 3: Typecheck + full suites**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit` (exit 0).
Run: `pnpm --filter @med-history/mobile test` (all pure tests pass).
Run: `pnpm --filter @med-history/core test` (all core tests pass).

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/entries/containers/newEntry.container.tsx apps/mobile/src/features/entries/containers/editEntry.container.tsx
git commit -m "feat(mobile): forward picked medication through new/edit entry containers"
```

---

### Task 12: On-device verification (manual)

**Files:** none.

- [ ] **Step 1:** Run (from `apps/mobile`): `npx expo start -c`; open in Expo Go (SDK 54).
- [ ] **Step 2:** Verify each:
  - On a region, **+ FAB → Prescriptions tab** new entry shows a **Medication** field (not a Title input).
  - Tapping it opens a **full-screen search modal**. The first open shows **"Preparing medication list…"** briefly (the one-time seed — this confirms **FTS5 works in Expo SQLite**), then a search box.
  - Typing e.g. `lisin 10` shows matching products; tapping one fills the Medication field with the product name and closes the modal. Typing a non-catalog name shows **`Use "<text>"`** at the top; tapping it sets that as the medication.
  - Saving creates the prescription; its card title is the medication name and (for a catalog pick) shows the **Strength** meta line.
  - Editing the prescription re-opens with the medication shown; re-picking changes it; saving persists.
  - **Fully close + relaunch** → the medication search opens instantly (no re-seed), and saved prescriptions (incl. rxcui in details) persist.
- [ ] **Step 3:** If all pass: `git commit --allow-empty -m "test(mobile): verified medication autocomplete on device"`. Otherwise capture the error and fix in the relevant task. (If FTS5 is unavailable in Expo SQLite, that surfaces here as a seed/search error — escalate; the fallback is a prebuilt-DB asset, a separate plan.)

---

## Self-review

**Spec coverage:**
- Bundle trimmed catalog asset → Task 4. ✓
- Core FTS5 table (m3) + repository (count/seed/search) + buildFtsQuery → Tasks 1–3. ✓
- Specific product + rxcui stored in details → Tasks 9 (builders), 10–11 (form/containers). ✓
- SQLite/FTS seed from bundled asset, lazy on first search with loader → Tasks 5 (loadCatalog), 6 (ensureSeeded), 7 (seed query), 8 (loader). ✓
- Full-screen `<Modal>` returning via callback → Task 8. ✓
- Free-text fallback (`Use "<typed>"`) → Task 8. ✓
- Replace Title with Medication field for prescriptions only → Task 10. ✓
- Card shows strength meta → Task 9 (entryMeta). ✓
- Edit prefill preserves rxcui unless re-picked → Tasks 10 (initialMedication), 11 (edit container). ✓
- vitest for buildFtsQuery, medications repo, coordinator, entries builders/meta → Tasks 1, 3, 6, 9. ✓
- On-device FTS5 + seed verification → Task 12. ✓

**Placeholder scan:** No TBD/"add validation" placeholders; every code step is complete. The asset is generated by an exact command (Task 4). RN tasks are typecheck-only with on-device checks in Task 12.

**Type consistency:** `MedicationSeedRow`/`MedicationHit` (core, Task 3) used by the catalog repository/port (Task 5), coordinator (Task 6), and components (Task 8). `MedicationPort` (Task 5) drives the coordinator (Task 6). `MedicationSelection` (Task 5) is produced by the modal (Task 8) and consumed by the form (Task 10). `MedicationDetails` (Task 9) flows form → `onSubmit(values, medication)` (Task 10) → `buildCreateInput`/`buildUpdateInput(…, medication)` (Task 9) → containers (Task 11). `medicationKeys.seed`/`.search` (Task 6) used by the hook (Task 7). `useMedicationSearch` returns `{ results, seeding, searching, error }` consumed by the modal (Task 8). `buildFtsQuery` (Task 1) used inside `search` (Task 3). The `medications` field on `Database` (Task 3) is read by the catalog repository (Task 5).

## Note (next feature)
A prebuilt-SQLite-DB asset (skipping the runtime seed entirely) is the fallback if Expo SQLite lacks FTS5; and drug–drug interaction checks over the stored rxcuis are a natural follow-on once prescriptions carry rxcui.
