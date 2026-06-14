# MedHistory — Body Screen Design

> Status: approved design, pending spec review.
> Date: 2026-06-13
> Supersedes the `/profile/[id]` placeholder shipped with the Profiles feature.

## Purpose

Replace the profile placeholder screen with the **body screen**: an SVG body silhouette with
tappable region dots that light up where a profile has history, plus an always-present "General"
control for region-less (systemic) entries. This is the profile's main screen and the primary
navigation surface into a profile's medical history.

Driven by data already in `packages/core`: `regions.list()` (the seeded ~40 `body_regions`) and
`entries.countsByRegion(profileId)` (a `Map<string | null, number>`; `null` = General). Grounded in
the mockup `docs/mockups/body.html` (silhouette path, dot coordinate tables, lit/unlit treatment,
Front/Back toggle).

## Decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Silhouette per sex | **One neutral silhouette** (the mock's single path) for both sexes | No new assets; dots/labels identical; sex already shows in the header. Per-sex outlines can come later. |
| 2 | Tap destination | **Placeholder region screen** (`/profile/[id]/region/[code]`) | Wires the full navigation now; the future entries feature fills it in. Mirrors how Profiles routed to a placeholder. |
| 3 | Which dots | **All region dots, always** — lit when `count > 0`, dim when empty | Every region is tappable, so an empty region can be opened (and later get its first entry). Matches the mock. |
| 4 | Lit-dot treatment | **Static glow halo** (accent fill + translucent halo circle); no animation | Clear and cheap; avoids animating ~32 SVG nodes. Pulsing can be added later. |
| 5 | Touch behavior | **Tap navigates directly**; dots get an enlarged invisible hit target scaling with `figureScale` | No hover on touch; the destination screen shows the region name. Standard touch pattern. |
| 6 | Delete profile | **Moved to a separate profile-settings screen** (`/profile/[id]/settings`) | The body screen takes over `/profile/[id]`; settings gives delete a home and room to grow (edit later). |
| 7 | Feature ownership | **New `features/body`** owns the body-map read; `features/profiles` gains only the settings screen | Keeps profiles focused on profile CRUD; a thin body feature owns "which regions have history." |

## Architecture

A new data-owning feature, structured like `features/profiles` and `features/settings`.

> **`features/body`** — *owns the body-map view: which regions have history for a profile.*

```
src/features/body/
  data/bodyDots.ts                                  # front/back dot tables {code, cx, cy} (presentation constant, from the mock)
  data/silhouette.ts                                # the SVG path string (presentation constant, from the mock)
  schemas/bodyMap.ts                                # Dot, BodyMap types (+ region-code sentinel helpers)
  repositories/bodyMap.repository.ts                # BodyMapPort over getDatabase().regions + .entries
  services/coordinators/bodyMap.coordinator.ts      # BodyMapPort + Result coordinator
  services/providers/bodyMap.provider.ts            # pure merge: regions(+counts) × dots → front/back Dot[] + generalCount
  queryKeys.ts                                      # bodyKeys
  hooks/useBodyMap.hook.ts
  components/bodySilhouette.component.tsx
  components/regionDot.component.tsx
  components/generalControl.component.tsx
  components/bodyViewToggle.component.tsx
  containers/bodyScreen.container.tsx               # composes useBodyMap + a read of useProfiles (header)
  containers/regionPlaceholder.container.tsx        # region label + "Entries coming next"
```

`features/profiles` additionally gains:
```
src/features/profiles/containers/profileSettings.container.tsx   # hosts Delete profile (moved from the old [id] placeholder)
```

Dot *positions* are presentation data (not in SQLite), so they live in `data/bodyDots.ts`. Region
*labels* stay single-sourced in core's seed and are read via `regions.list()`.

### Forward note

Region counts (`entries.countsByRegion`) are entries-domain data read here directly through core.
When a dedicated entries feature is built, that access (and `bodyKeys` invalidation on entry writes)
may migrate to it. Not built now.

## Data flow

```
bodyScreen.container (profileId from route param)
  ├─ useProfiles()            → header: name, calcAge(dob), Female/Male   (cross-feature read, intentional)
  └─ useBodyMap(profileId)    → useQuery, staleTime: Infinity
        coordinator.loadMap(profileId)                 → Result<BodyMap>
          port.listRegions()        → getDatabase().regions.list()
          port.countsByRegion(id)   → getDatabase().entries.countsByRegion(id)
        provider.buildBodyMap(regions, counts)         → pure
            → { front: Dot[], back: Dot[], generalCount: number }
```

- `Dot = { code: string; label: string; cx: number; cy: number; lit: boolean }` where `lit = (count ?? 0) > 0`.
- `BodyMap = { front: Dot[]; back: Dot[]; generalCount: number }`.
- The provider iterates the front/back dot tables (the canonical set of placed regions), joining each
  `code` to its region label and its count. A region in the seed without a placed dot is simply not
  shown (the dot tables are the source of placement); a placed code missing from the seed would carry
  an empty label — the provider falls back to the code. `generalCount = counts.get(null) ?? 0`.
- With no entries yet, every count is 0 → all dots dim, General dim. Correct empty state.
- The region placeholder screen calls `useBodyMap(profileId)` too and finds its region by `code` to
  show the label (no separate regions hook). `code === 'general'` resolves to "General".

## Rendering (mock → React Native)

- **Silhouette:** `react-native-svg` `<Svg viewBox="0 0 206.326 206.326">` containing the mock's
  `<Path>` (stroke only, no fill), stroked with a theme token. Same path for front and back.
- **Dots:** map the active view's table. Dim = small muted circle; **lit** = accent-filled circle
  with a larger translucent halo circle rendered behind it (static). Each dot is wrapped so its
  touch target is larger than its visual radius and scales with `theme.figureScale`. Tap → navigate
  to `/profile/[id]/region/[code]`.
- **Front/Back toggle:** a segmented control (selected/unselected variant styles, same approach as
  the profile form), default **Front**. Required because some regions are back-only (upper-back,
  lower-back, glutes, hamstrings, calves).
- **General control:** a labeled pill below the figure, always present; lit when `generalCount > 0`;
  tap → `/profile/[id]/region/general`.
- **Sizing / scroll:** the figure is width-relative and scales with `figureScale`; when it exceeds
  the viewport the screen scrolls vertically rather than shrinking the figure (data-model spec §
  Accessibility sizing).
- **Theme tokens:** add any needed tokens (figure stroke, dot fill/halo) to `src/constants/theme.ts`
  for both light and dark; no hardcoded hex in components (`mobile.md §4`).

## Screens & routes (Expo Router restructure)

`app/profile/[id].tsx` becomes a folder so children can nest under it:

| Route | Renders | Notes |
|---|---|---|
| `app/profile/[id]/index.tsx` | `<BodyScreenContainer/>` (`features/body`) | Replaces the old placeholder; `ProfileDetailContainer` is removed. Header: back, name + age, settings icon. |
| `app/profile/[id]/settings.tsx` | `<ProfileSettingsContainer/>` (`features/profiles`) | Hosts **Delete profile** (existing `Alert` → `deleteProfile` → `router.replace('/')`); shows name/age/sex read-only. Edit deferred. |
| `app/profile/[id]/region/[code].tsx` | `<RegionPlaceholderContainer/>` (`features/body`) | Region label + "Entries coming next." `code === 'general'` ⇒ General. |

`app/profile/new.tsx` (the add-profile modal) is unchanged. Each screen renders exactly one
container (`mobile.md`). Route-literal strings use `as any` casts until `expo start` regenerates
typed routes (consistent with the rest of the app).

## Testing

- **vitest (pure logic):**
  - `bodyMap.provider` — `lit` flag from counts, `generalCount`, label join, back-only codes present
    only in the back table, code fallback when a label is missing.
  - region-code sentinel mapping — `'general'` ⇄ `null`.
  - `bodyMap.coordinator` — `Result` ok/err wrapping via a fake `BodyMapPort` (same pattern as the
    profiles coordinator test).
- **typecheck-only + on-device:** all `react-native-svg` components, containers, and screens. No
  simulator in CI; verified on device.

## Out of scope (later features)

- The real region entry list (Visits / Notes / Prescriptions / Imaging & Tests) behind the region
  placeholder — the entries feature.
- Editing a profile (rename, change DOB/sex) from the settings screen.
- Per-sex silhouettes; animated dot pulsing.
