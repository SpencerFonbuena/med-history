# MedHistory — Prescription Medication Autocomplete Design

> Status: approved design, pending spec review.
> Date: 2026-06-14
> Realizes the data-model spec's "Prescriptions ↔ medication catalog" forward hook.

## Purpose

When adding/editing a **prescription** entry, let the user search a bundled drug catalog and pick a
specific product, storing its `rxcui` (plus strength / dose form) on the entry. The search is a
full-screen modal over ~27k RxNorm clinical drug products, backed by SQLite FTS5. Non-catalog drugs
(compounded meds, supplements) are still enterable as free text.

## Decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Granularity | **Specific product + `rxcui`** from the full catalog | Precise + RxNorm-linked (future interaction checks/dedup); matches the data-model intent. |
| 2 | On-device search | **Bundle JSON asset → seed a SQLite FTS5 table** | Fast indexed search, low JS heap, consistent with the local-first SQLite stack. |
| 3 | Picker UX | **Full-screen React Native `<Modal>`** (not a router route) returning the pick via callback | Sidesteps Expo Router's "return a value from a pushed screen" problem; textbook value-returning picker. |
| 4 | Not-found | **Free-text fallback** (`Use "<typed>"`) | Handles compounded meds / supplements / anything RxNorm lacks. |
| 5 | Form integration | For prescriptions, **replace the Title field with a Medication field** | The medication is the prescription's identity and should title the card; no redundant name fields. |
| 6 | Seed timing | **Lazily on first search**, behind a one-time loader; idempotent | Don't pay the ~1-3s seed cost unless the user actually adds a prescription. |

## Catalog data

Source: `/private/tmp/rxnav` (`transform.py` output). `medications.json` is 27,258 products
(17,563 generic SCD + 9,695 brand SBD), each `{ name, type, brand?, doseForm?, quantity?,
ingredients[], strength?, rxcui }`. `ingredients.json` / `brands.json` are name-only (no rxcui) and
are **not** used here.

**Bundled asset** (`apps/mobile/assets/data/medications.json`): trimmed to the fields used —
`{ rxcui, name, type, brand?, strength?, doseForm? }` — dropping `ingredients`/`quantity`/
`lowConfidence` to shrink the bundle well under 7MB. A one-time prep step (documented in the plan)
produces the trimmed file from the `transform.py` output.

## Architecture — core data layer

A new migration plus a `medications` repository in `packages/core`.

- **Migration `m2`** (`packages/core/src/db/migrations/m2-medications.ts`): create one FTS5 table —
  ```sql
  CREATE VIRTUAL TABLE medications USING fts5(
    name, rxcui UNINDEXED, type UNINDEXED, brand UNINDEXED,
    strength UNINDEXED, doseForm UNINDEXED, tokenize='porter unicode61'
  );
  ```
  One table serves both search (on `name`) and display (the UNINDEXED columns). The migration
  creates the empty table only — it does **not** embed the 27k rows (a TS constant that large is
  unusable; rows are seeded at runtime from the bundled asset).
- **`medications` repository** (`makeMedicationsRepository(driver)`):
  - `count(): Promise<number>` — `SELECT count(*) FROM medications`.
  - `seed(rows: MedicationSeedRow[]): Promise<void>` — idempotent; if `count() > 0` returns
    immediately, else bulk-inserts all rows inside one transaction.
  - `search(query: string, limit = 30): Promise<MedicationHit[]>` — applies `buildFtsQuery` to the
    raw user text internally; if that yields `''` returns `[]`, else runs
    `SELECT rxcui, name, strength, doseForm FROM medications WHERE medications MATCH ? ORDER BY rank LIMIT ?`.
    Callers pass raw text, never a pre-built FTS string.
  - Types: `MedicationSeedRow { rxcui, name, type, brand?, strength?, doseForm? }`,
    `MedicationHit { rxcui, name, strength?, doseForm? }`.
- **`buildFtsQuery(input: string): string`** (pure, in core, e.g. `db/ftsQuery.ts`): tokenise on
  whitespace, strip FTS5-special punctuation from each token, append `*` (prefix) and AND the terms
  (`lisin 10` → `lisin* 10*`). Returns `''` when there are no usable tokens (callers treat `''` as
  "no search"). Unit-tested independently.
- Core `index.ts` exports `makeMedicationsRepository` is wired into `openDatabase` (the `Database`
  interface gains `medications`), plus `type MedicationHit`, `type MedicationSeedRow`, `buildFtsQuery`.

> **FTS5 availability:** core's vitest driver (better-sqlite3) ships FTS5, so seed/search are
> unit-testable. Expo's SQLite build normally includes FTS5 — confirmed on the on-device task.

## Architecture — `features/medications` (mobile)

> **`features/medications`** — *owns the bundled drug catalog: seeding it and searching it.*

```
src/features/medications/
  schemas/medication.ts                                  # MedicationSelection union; re-export MedicationHit
  repositories/medicationCatalog.repository.ts            # loads the bundled JSON asset (Expo Asset) → MedicationSeedRow[]
  services/coordinators/medicationSearch.coordinator.ts   # MedicationPort + ensureSeeded()/search() → Result
  services/coordinators/medicationSearch.coordinator.instance.ts
  queryKeys.ts                                            # medicationKeys.search(query)
  hooks/useMedicationSearch.hook.ts                       # debounced query → results; ensureSeeded once
  components/medicationSearchResult.component.tsx + .styles.ts
  components/medicationSearchModal.component.tsx + .styles.ts
```

- **`medicationCatalog.repository.ts`**: resolves the bundled asset via `expo-asset` (+ `expo-file-system`
  to read it), `JSON.parse`s it to `MedicationSeedRow[]`. Also exposes the core-backed port methods
  (`count`, `seed`, `search`) by delegating to `getDatabase().medications`.
- **`medicationSearch.coordinator.ts`** drives a `MedicationPort { count, seed, search, loadCatalog }`:
  - `ensureSeeded(): Promise<Result<void>>` — if `count() === 0`, `loadCatalog()` then `seed(rows)`.
  - `search(query): Promise<Result<MedicationHit[]>>`.
- **`useMedicationSearch(query)`**: calls `ensureSeeded` once (via a `useQuery`/effect that resolves
  before the first search), then a debounced (~200ms) `useQuery` keyed by `medicationKeys.search(query)`
  with `staleTime: Infinity` returning hits (or `[]` for blank). Exposes `seeding` so the modal can
  show the one-time "Preparing medication list…" loader.
- **`MedicationSearchModal`** (React Native `<Modal presentationStyle="fullScreen">`): props
  `{ visible, onSelect, onClose }`. Renders an autofocused search `TextInput`, a `FlatList` of
  `MedicationSearchResult` rows, and — when the input is non-empty — a top **`Use "<typed text>"`**
  row. Selecting a result calls `onSelect({ kind: 'catalog', rxcui, name, strength?, doseForm? })`;
  the free-text row calls `onSelect({ kind: 'freeText', name: <typed> })`. A Cancel/close control
  calls `onClose`.
- `MedicationSelection = { kind: 'catalog'; rxcui: string; name: string; strength?: string; doseForm?: string } | { kind: 'freeText'; name: string }`.

## Prescription form integration (`features/entries`)

- The `EntryForm`, for `type === 'prescription'` **only**, replaces the free-text Title `TextInput`
  with a **Medication** row: a `Pressable` showing the current title (or "Select medication"). Tapping
  it sets local state `medSearchVisible = true`, rendering the imported `MedicationSearchModal`.
- `onSelect(selection)`: set the form's `title` to `selection.name`; if `selection.kind === 'catalog'`,
  store the selection (rxcui/strength/doseForm) in form state; close the modal. Non-prescription types
  keep the existing plain Title input and ignore all medication logic.
- **Input builders** (`entryTypes.provider`): `buildCreateInput`/`buildUpdateInput` gain an optional
  `medication?: { rxcui; strength?; doseForm? }` argument; when present they attach
  `details: { rxcui, strength?, doseForm? }`. Free-text / non-prescription entries pass nothing →
  no `details`.
- **`entryMeta`**: when an entry's `details` carries `rxcui`, add a meta line for `strength`/`doseForm`
  (e.g. `Strength: 10 MG`), so a prescription card reads naturally.
- **Edit prefill:** opening an existing prescription shows its title as the Medication value; its
  `details` (rxcui/strength/doseForm) ride along unchanged unless the user re-picks. (Re-opening the
  search to change the medication replaces them.)

## Data flow

```
EntryForm (prescription) — Medication row tap → <MedicationSearchModal visible>
  modal: useMedicationSearch(query)
    ensureSeeded(): count()===0 ? loadCatalog()→seed(rows) : noop      (one-time, with loader)
    search(query): core.medications.search(query, 30)   // search() applies buildFtsQuery internally
  onSelect(selection) → form.title = selection.name
                        selection.kind==='catalog' → form.medication = { rxcui, strength, doseForm }
                        close modal
  Save → buildCreateInput(profileId, regionCode, 'prescription', values, form.medication)
           → CreateEntryInput with details: { rxcui, strength?, doseForm? }
```

## Testing

- **vitest (pure / core):**
  - `buildFtsQuery` — tokenise, prefix `*`, AND terms, punctuation stripping, blank → `''`.
  - core `medications` repo — `seed` then `search('lisin 10')` returns ranked prefix matches; `count`
    reflects seeded rows; second `seed` is a no-op (idempotent); blank query → `[]`.
  - entries `entryTypes.provider` — a catalog `medication` arg yields `details: { rxcui, strength, doseForm }`;
    omitted/free-text yields no `details`; `entryMeta` surfaces the strength line when `details.rxcui` present.
- **typecheck-only + on-device:** the asset-loading repository, search modal/result components, the
  hook, and the prescription-form integration. The on-device task also **verifies FTS5 works in Expo
  SQLite** and that the one-time seed completes behind the loader, then a search returns results and a
  picked product persists its rxcui.

## Out of scope (later)

- Drug–drug interaction checks; dedup across a profile's prescriptions.
- Ingredient/brand-only browsing (the name-only lists are unused here).
- Editing or version-bumping the bundled catalog (it ships static; a refresh is a future migration).

## Note (build prep)

The trimmed `medications.json` asset is produced once from the `transform.py` output by dropping
`ingredients`/`quantity`/`lowConfidence`. The plan's first task documents the exact command and commits
the resulting asset, so the feature is self-contained in the repo afterward.
