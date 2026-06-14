# Onboarding & Appearance — Design

> Status: approved design, pending spec review.
> Date: 2026-06-13
> Branch: `feat/onboarding-appearance` (stacked on `feat/core-data-layer`)

## Purpose

Build the app's first-run onboarding: the user picks a **size** (text + person figure) and a
**light/dark theme**, then reads and acknowledges a privacy statement explaining that all data
is on-device. This also bootstraps the app's first real data wiring (core ↔ expo-sqlite),
the appearance/theming infrastructure, and the size-scaling system.

Builds on the data layer in `docs/specs/2026-06-13-data-model-design.md` and `packages/core`.

## Scope note

This is more than three screens — it is the foundation every later screen depends on:
the SQLite driver adapter, the query provider, the settings feature, and the appearance/theme
system. Onboarding is the first consumer of all of it.

## Decisions (approved)

- **Theme options:** Light / Dark only (explicit choice, no "system/auto"). Default `dark`.
- **Size preview:** live — sample text **and** a person silhouette scale as the user picks.
- **Flow:** 3 steps — Size → Theme → Privacy (acknowledge to finish).
- **Scaling approach:** the size level is baked into `theme` via `useTheme()` (single source of
  truth, consumed by `makeStyles(theme)`), not a separate per-component hook or OS font scaling.

## 1. Core change (packages/core)

Add theme persistence. Append-only migration (exercises the existing runner; does not edit
migration 1):

```sql
-- migration 2
ALTER TABLE app_settings ADD COLUMN theme TEXT NOT NULL DEFAULT 'dark';
```

- `AppSettings` gains `theme: 'light' | 'dark'`; settings repo `get()` maps the column.
- New repo method `setTheme(theme: 'light' | 'dark')` (validated via a `Theme` zod enum).
- New `Theme` enum in `schemas/enums.ts`: `z.enum(['light','dark'])`.
- Migration 2 test: a DB migrated from scratch has the column defaulting to `'dark'`;
  `migrate` is still idempotent.

## 2. Appearance / scaling system (apps/mobile)

### Typography scale (new — defines the constants `mobile.md §4` deferred)

Base sizes (level 1, from the mock's 11–32px range), in `constants/typography.ts`:

```ts
export const baseType = {
  caption: 12, footnote: 13, body: 15, callout: 16,
  subtitle: 18, title: 20, largeTitle: 26, hero: 32,
} as const;
```

### Size level → multipliers (`constants/appearance.ts`)

From the data-model spec's first-pass table:

```ts
export const SIZE_LEVELS = [1, 2, 3, 4, 5] as const;
export const sizeLabels = ['Default', 'Large', 'Larger', 'Extra large', 'Very large'];
export const textScaleByLevel   = { 1: 1.0, 2: 1.15, 3: 1.35, 4: 1.65, 5: 2.0 };
export const figureScaleByLevel = { 1: 1.0, 2: 1.08, 3: 1.18, 4: 1.30, 5: 1.45 };
```

Pure helpers `textScale(level)` / `figureScale(level)` — unit-tested.

### Theme shape (extend `constants/theme.ts`)

`getTheme(scheme, sizeLevel)` now also returns:
- `text`: `baseType` values each multiplied by `textScale(sizeLevel)` and rounded.
- `figureScale`: `figureScale(sizeLevel)`.

**`<AppearanceProvider>`** (in `features/settings`) is the single source of truth for the active
appearance. It holds the **effective** `{ scheme, sizeLevel }` (seeded from persisted settings)
plus an optional **preview override**. `useTheme()` returns
`getTheme(override ?? effective)`. Components use `theme.text.body` etc.; the body figure
multiplies its dimensions by `theme.figureScale`.

During onboarding, each step sets the preview override live (e.g. tapping "Very large" calls
`setPreview({ sizeLevel: 5 })`), so the entire onboarding UI re-renders at the chosen size/theme
immediately — before anything is persisted. "Get started" persists the final values and clears
the override; the provider then reflects the now-persisted settings. This keeps one theme path
for the whole app and avoids flicker.

## 3. Data wiring (apps/mobile)

- **`src/lib/db/`**: an `expo-sqlite` `DbDriver` adapter (wraps `SQLiteDatabase` async methods to
  the core interface), and `getDatabase()` — opens the device DB once and calls core's
  `openDatabase(driver, { genId, now })` with `genId = expo-crypto randomUUID`,
  `now = () => new Date().toISOString()`.
- **`<QueryProvider>`** in `_layout.tsx` (one app-lifetime `QueryClient`, `staleTime: Infinity`).
- **`features/settings/`** (owns `app_settings`):
  - `repositories/settings.repository.ts` — thin wrapper over `getDatabase().settings`.
  - `services/coordinators/settings.coordinator.ts` — returns typed `Result<T>`.
  - `hooks/useSettings.hook.ts` (read), `hooks/useUpdateAppearance.hook.ts` (mutations:
    setSizeLevel, setTheme, completeOnboarding) — react-query, invalidate on write.
  - `queryKeys.ts`.
  - `context/appearance.provider.tsx` — `<AppearanceProvider>` + `useAppearance()`: holds the
    effective `{ scheme, sizeLevel }` (seeded from persisted settings) and the preview override,
    exposes `setPreview()` / `clearPreview()`. `useTheme()` is built on it.
  - `Result<T>` (success+data | error+userMessage) is a small shared type used by the coordinator;
    define it in `features/settings/schemas/` (or a shared `lib/result.ts`).

## 4. Flow & screens

Root `_layout.tsx`: wrap in providers, read settings; while loading show a splash/null; then
gate — `onboarding_done === false` → redirect to `/(onboarding)/size`, else the main app.

### Step 1 — Size (`app/(onboarding)/size.tsx`)
Five tappable options (Default → Very large). A live preview pane renders a sample heading +
paragraph and a **person silhouette** (`react-native-svg`) scaled by the selected level's
text/figure multipliers. "Continue" advances (selection held in local/onboarding state).

### Step 2 — Theme (`app/(onboarding)/theme.tsx`)
Two large cards (Light, Dark), each a mini-preview swatch. Dark pre-selected. "Continue".

### Step 3 — Privacy (`app/(onboarding)/privacy.tsx`)
The statement (below) + an "I understand" checkbox that enables **Get started**. On press:
persist `setSizeLevel`, `setTheme`, then `completeOnboarding()`, then `router.replace('/')`.

The whole stack renders using the **in-progress** size/theme selections so the user sees their
choices applied live as they move through steps.

### Privacy copy (approved)

> **Your data stays on this phone**
>
> MedHistory stores everything you enter — profiles, visits, notes, prescriptions, and any
> documents — **only on this device**.
>
> There are no servers and no accounts. We cannot see, collect, or access your medical
> information, and neither can anyone else — not us, not a hospital, not an insurer — because it
> never leaves your phone.
>
> This has one important trade-off: because your records live only here, **if you lose or reset
> this phone without a backup, they are permanently gone.** We can't recover them, because we
> never had them.
>
> A future update will let you **export your data to a file and import it on another phone**, so
> you can back it up or move it yourself, on your terms.
>
> ☐ I understand my data is stored only on this device.

## 5. File structure (per mobile.md)

```
packages/core/src/
  schemas/enums.ts                      # + Theme enum
  schemas/settings.schema.ts            # AppSettings + theme
  db/migrations/m2-theme.ts             # ALTER TABLE add theme
  db/migrations/index.ts                # register m2
  repositories/settings.repository.ts   # + setTheme

apps/mobile/src/
  constants/typography.ts               # baseType
  constants/appearance.ts               # level → multipliers + labels
  constants/theme.ts                    # getTheme(scheme, sizeLevel) → + text + figureScale
  hooks/useTheme.hook.ts                # reads persisted settings
  lib/db/expoSqliteDriver.ts            # DbDriver over expo-sqlite
  lib/db/database.ts                    # getDatabase() singleton
  providers/QueryProvider.tsx
  features/settings/
    repositories/settings.repository.ts
    services/coordinators/settings.coordinator.ts
    hooks/useSettings.hook.ts
    hooks/useUpdateAppearance.hook.ts
    context/appearance.provider.tsx       # AppearanceProvider + useAppearance (effective + preview override)
    schemas/result.ts                     # Result<T>
    queryKeys.ts
    components/sizeSelector.component.tsx
    components/themeSelector.component.tsx
    components/personFigure.component.tsx   # silhouette for preview (+ reused later)
  app/_layout.tsx                       # providers + onboarding gate
  app/(onboarding)/_layout.tsx          # stack
  app/(onboarding)/size.tsx
  app/(onboarding)/theme.tsx
  app/(onboarding)/privacy.tsx
```

## 6. Testing

- **Core (vitest):** migration 2 adds the column with default `dark` + idempotency; `setTheme`
  persists and `get()` returns it; `Theme` enum rejects bad values.
- **Mobile (vitest, pure units):** `textScale`/`figureScale`/`getTheme` produce expected scaled
  type sizes per level; settings coordinator maps repo results to `Result<T>`.
- **Manual (Expo on device):** the 3-step flow, live preview scaling, theme switch, privacy
  acknowledgment gating "Get started", and that relaunch skips onboarding.

## Open questions

- None blocking. (A Settings screen to change size/theme *after* onboarding is out of scope here
  — onboarding writes them; a later Settings screen will reuse the same selector components and
  mutation hooks.)
