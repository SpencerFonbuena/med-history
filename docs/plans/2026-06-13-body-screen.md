# Body Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/profile/[id]` placeholder with the body screen — an SVG silhouette whose region dots light up where a profile has history, plus an always-present "General" control — and move delete-profile into a new profile-settings screen.

**Architecture:** A new data-owning `features/body` mirrors `features/profiles`: presentation constants (silhouette path + dot tables) → a pure `buildBodyMap` provider → a `Result`-returning coordinator over a `BodyMapPort` (core's `regions` + `entries.countsByRegion`) → a react-query hook. SVG components render the figure; containers compose them; Expo Router nests `index`/`settings`/`region/[code]` under `app/profile/[id]/`.

**Tech Stack:** TypeScript, `packages/core` (`regions`, `entries`), Expo SDK 54 (expo-router, react-native-svg), @tanstack/react-query v5, vitest (pure-logic tests).

**Branch:** `feat/body-screen` (off `main`). Spec: `docs/specs/2026-06-13-body-screen-design.md`.

**Verification note:** Tasks 2–4 have vitest tests (`pnpm --filter @med-history/mobile test`). Tasks 1 and 5–13 are RN/Expo or pure constants and are verified by `pnpm --filter @med-history/mobile exec tsc --noEmit` only (no simulator); runtime is checked on-device in Task 14. Route-literal strings use `as any` casts (Expo Router typed-routes regenerate on `expo start`), consistent with the rest of the app.

---

## File structure

```
apps/mobile/src/
  features/body/
    data/silhouette.ts                              # SVG path constant (from the mock)
    data/bodyDots.ts                                # FRONT_DOTS / BACK_DOTS tables (from the mock)
    schemas/bodyMap.ts                              # Dot, BodyMap types
    utils/regionParam.ts                            # 'general' <-> null sentinel helpers (pure)
    services/providers/bodyMap.provider.ts          # buildBodyMap(regions, counts) -> BodyMap (pure)
    services/coordinators/bodyMap.coordinator.ts    # BodyMapPort + Result coordinator
    services/coordinators/bodyMap.coordinator.instance.ts  # wired singleton (repo + coordinator)
    repositories/bodyMap.repository.ts              # BodyMapPort over getDatabase().regions + .entries
    queryKeys.ts                                    # bodyKeys
    hooks/useBodyMap.hook.ts
    components/bodySilhouette.component.tsx          # <Svg> wrapper + outline <Path>
    components/regionDot.component.tsx               # one dot (<G>: hit + halo + dot)
    components/bodyViewToggle.component.tsx          # Front/Back segmented control
    components/bodyViewToggle.styles.ts
    components/generalControl.component.tsx          # "General" pill
    components/generalControl.styles.ts
    containers/bodyScreen.container.tsx              # composes useBodyMap + useProfiles header
    containers/bodyScreen.styles.ts
    containers/regionPlaceholder.container.tsx       # region label + "Entries coming next"
    containers/regionPlaceholder.styles.ts
  features/profiles/
    containers/profileSettings.container.tsx         # Delete profile (moved here) + read-only info
    containers/profileSettings.styles.ts
  constants/theme.ts                                 # + figureStroke, dotDim tokens
  app/profile/[id]/index.tsx                         # <BodyScreenContainer/>  (was app/profile/[id].tsx)
  app/profile/[id]/settings.tsx                      # <ProfileSettingsContainer/>
  app/profile/[id]/region/[code].tsx                 # <RegionPlaceholderContainer/>
```

Removed in Task 13: `app/profile/[id].tsx`, `features/profiles/containers/profileDetail.container.tsx`, `features/profiles/containers/profileDetail.styles.ts`.

---

### Task 1: presentation constants (silhouette + dot tables)

**Files:**
- Create: `apps/mobile/src/features/body/data/silhouette.ts`
- Create: `apps/mobile/src/features/body/data/bodyDots.ts`

- [ ] **Step 1: Create the silhouette path constant**

```ts
// apps/mobile/src/features/body/data/silhouette.ts

/**
 * Single standing-figure outline used for both front and back views and both sexes.
 * Lifted verbatim from docs/mockups/body.html (viewBox 0 0 206.326 206.326).
 * Whitespace/newlines inside SVG path data are insignificant.
 */
export const SILHOUETTE_PATH = `M104.265,117.959c-0.304,3.58,2.126,22.529,3.38,29.959c0.597,3.52,2.234,9.255,1.645,12.3
c-0.841,4.244-1.084,9.736-0.621,12.934c0.292,1.942,1.211,10.899-0.104,14.175c-0.688,1.718-1.949,10.522-1.949,10.522
c-3.285,8.294-1.431,7.886-1.431,7.886c1.017,1.248,2.759,0.098,2.759,0.098c1.327,0.846,2.246-0.201,2.246-0.201
c1.139,0.943,2.467-0.116,2.467-0.116c1.431,0.743,2.758-0.627,2.758-0.627c0.822,0.414,1.023-0.109,1.023-0.109
c2.466-0.158-1.376-8.05-1.376-8.05c-0.92-7.088,0.913-11.033,0.913-11.033c6.004-17.805,6.309-22.53,3.909-29.24
c-0.676-1.937-0.847-2.704-0.536-3.545c0.719-1.941,0.195-9.748,1.072-12.848c1.692-5.979,3.361-21.142,4.231-28.217
c1.169-9.53-4.141-22.308-4.141-22.308c-1.163-5.2,0.542-23.727,0.542-23.727c2.381,3.705,2.29,10.245,2.29,10.245
c-0.378,6.859,5.541,17.342,5.541,17.342c2.844,4.332,3.921,8.442,3.921,8.747c0,1.248-0.273,4.269-0.273,4.269l0.109,2.631
c0.049,0.67,0.426,2.977,0.365,4.092c-0.444,6.862,0.646,5.571,0.646,5.571c0.92,0,1.931-5.522,1.931-5.522
c0,1.424-0.348,5.687,0.42,7.295c0.919,1.918,1.595-0.329,1.607-0.78c0.243-8.737,0.768-6.448,0.768-6.448
c0.511,7.088,1.139,8.689,2.265,8.135c0.853-0.407,0.073-8.506,0.073-8.506c1.461,4.811,2.569,5.577,2.569,5.577
c2.411,1.693,0.92-2.983,0.585-3.909c-1.784-4.92-1.839-6.625-1.839-6.625c2.229,4.421,3.909,4.257,3.909,4.257
c2.174-0.694-1.9-6.954-4.287-9.953c-1.218-1.528-2.789-3.574-3.245-4.789c-0.743-2.058-1.304-8.674-1.304-8.674
c-0.225-7.807-2.155-11.198-2.155-11.198c-3.3-5.282-3.921-15.135-3.921-15.135l-0.146-16.635
c-1.157-11.347-9.518-11.429-9.518-11.429c-8.451-1.258-9.627-3.988-9.627-3.988c-1.79-2.576-0.767-7.514-0.767-7.514
c1.485-1.208,2.058-4.415,2.058-4.415c2.466-1.891,2.345-4.658,1.206-4.628c-0.914,0.024-0.707-0.733-0.707-0.733
C115.068,0.636,104.01,0,104.01,0h-1.688c0,0-11.063,0.636-9.523,13.089c0,0,0.207,0.758-0.715,0.733
c-1.136-0.03-1.242,2.737,1.215,4.628c0,0,0.572,3.206,2.058,4.415c0,0,1.023,4.938-0.767,7.514c0,0-1.172,2.73-9.627,3.988
c0,0-8.375,0.082-9.514,11.429l-0.158,16.635c0,0-0.609,9.853-3.922,15.135c0,0-1.921,3.392-2.143,11.198
c0,0-0.563,6.616-1.303,8.674c-0.451,1.209-2.021,3.255-3.249,4.789c-2.408,2.993-6.455,9.24-4.29,9.953
c0,0,1.689,0.164,3.909-4.257c0,0-0.046,1.693-1.827,6.625c-0.35,0.914-1.839,5.59,0.573,3.909c0,0,1.117-0.767,2.569-5.577
c0,0-0.779,8.099,0.088,8.506c1.133,0.555,1.751-1.047,2.262-8.135c0,0,0.524-2.289,0.767,6.448
c0.012,0.451,0.673,2.698,1.596,0.78c0.779-1.608,0.429-5.864,0.429-7.295c0,0,0.999,5.522,1.933,5.522
c0,0,1.099,1.291,0.648-5.571c-0.073-1.121,0.32-3.422,0.369-4.092l0.106-2.631c0,0-0.274-3.014-0.274-4.269
c0-0.311,1.078-4.415,3.921-8.747c0,0,5.913-10.488,5.532-17.342c0,0-0.082-6.54,2.299-10.245c0,0,1.69,18.526,0.545,23.727
c0,0-5.319,12.778-4.146,22.308c0.864,7.094,2.53,22.237,4.226,28.217c0.886,3.094,0.362,10.899,1.072,12.848
c0.32,0.847,0.152,1.627-0.536,3.545c-2.387,6.71-2.083,11.436,3.921,29.24c0,0,1.848,3.945,0.914,11.033
c0,0-3.836,7.892-1.379,8.05c0,0,0.192,0.523,1.023,0.109c0,0,1.327,1.37,2.761,0.627c0,0,1.328,1.06,2.463,0.116
c0,0,0.91,1.047,2.237,0.201c0,0,1.742,1.175,2.777-0.098c0,0,1.839,0.408-1.435-7.886c0,0-1.254-8.793-1.945-10.522
c-1.318-3.275-0.387-12.251-0.106-14.175c0.453-3.216,0.21-8.695-0.618-12.934c-0.606-3.038,1.035-8.774,1.641-12.3
c1.245-7.423,3.685-26.373,3.38-29.959l1.008,0.354C103.809,118.312,104.265,117.959,104.265,117.959z`;

/** SVG viewBox is square; both dot tables are positioned in this coordinate space. */
export const BODY_VIEWBOX = 206.326;
```

- [ ] **Step 2: Create the dot tables**

```ts
// apps/mobile/src/features/body/data/bodyDots.ts

/** A region marker placed on the figure. Coordinates are in the BODY_VIEWBOX space. */
export interface DotPosition {
  code: string;
  cx: number;
  cy: number;
}

// Front + back marker positions, lifted verbatim from docs/mockups/body.html.
export const FRONT_DOTS: DotPosition[] = [
  { code: 'ear-left', cx: 88, cy: 15 },
  { code: 'eye-left', cx: 98, cy: 13 },
  { code: 'nose', cx: 103, cy: 19 },
  { code: 'eye-right', cx: 108, cy: 13 },
  { code: 'ear-right', cx: 119, cy: 15 },
  { code: 'mouth', cx: 103, cy: 24 },
  { code: 'shoulder-left', cx: 82, cy: 42 },
  { code: 'shoulder-right', cx: 124, cy: 42 },
  { code: 'chest', cx: 103, cy: 55 },
  { code: 'ribs', cx: 103, cy: 72 },
  { code: 'stomach', cx: 103, cy: 88 },
  { code: 'pelvis', cx: 103, cy: 108 },
  { code: 'hip-left', cx: 92, cy: 112 },
  { code: 'hip-right', cx: 114, cy: 112 },
  { code: 'elbow-left', cx: 79, cy: 74 },
  { code: 'elbow-right', cx: 127, cy: 74 },
  { code: 'forearm-left', cx: 72, cy: 88 },
  { code: 'forearm-right', cx: 134, cy: 88 },
  { code: 'wrist-left', cx: 71, cy: 102 },
  { code: 'wrist-right', cx: 135, cy: 102 },
  { code: 'hand-left', cx: 70, cy: 114 },
  { code: 'hand-right', cx: 136, cy: 114 },
  { code: 'thigh-left', cx: 96, cy: 132 },
  { code: 'thigh-right', cx: 110, cy: 132 },
  { code: 'knee-left', cx: 95, cy: 153 },
  { code: 'knee-right', cx: 111, cy: 153 },
  { code: 'shin-left', cx: 94, cy: 174 },
  { code: 'shin-right', cx: 112, cy: 174 },
  { code: 'ankle-left', cx: 96, cy: 190 },
  { code: 'ankle-right', cx: 110, cy: 190 },
  { code: 'foot-left', cx: 95, cy: 202 },
  { code: 'foot-right', cx: 111, cy: 202 },
];

export const BACK_DOTS: DotPosition[] = [
  { code: 'ear-left', cx: 88, cy: 15 },
  { code: 'ear-right', cx: 119, cy: 15 },
  { code: 'shoulder-left', cx: 82, cy: 42 },
  { code: 'shoulder-right', cx: 124, cy: 42 },
  { code: 'upper-back', cx: 103, cy: 58 },
  { code: 'lower-back', cx: 103, cy: 90 },
  { code: 'glute-left', cx: 97, cy: 113 },
  { code: 'glute-right', cx: 109, cy: 113 },
  { code: 'elbow-left', cx: 79, cy: 74 },
  { code: 'elbow-right', cx: 127, cy: 74 },
  { code: 'forearm-left', cx: 72, cy: 88 },
  { code: 'forearm-right', cx: 134, cy: 88 },
  { code: 'wrist-left', cx: 71, cy: 102 },
  { code: 'wrist-right', cx: 135, cy: 102 },
  { code: 'hand-left', cx: 70, cy: 114 },
  { code: 'hand-right', cx: 136, cy: 114 },
  { code: 'hamstring-left', cx: 96, cy: 132 },
  { code: 'hamstring-right', cx: 110, cy: 132 },
  { code: 'knee-left', cx: 95, cy: 153 },
  { code: 'knee-right', cx: 111, cy: 153 },
  { code: 'calf-left', cx: 94, cy: 174 },
  { code: 'calf-right', cx: 112, cy: 174 },
  { code: 'ankle-left', cx: 96, cy: 190 },
  { code: 'ankle-right', cx: 110, cy: 190 },
  { code: 'foot-left', cx: 95, cy: 202 },
  { code: 'foot-right', cx: 111, cy: 202 },
];
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/body/data
git commit -m "feat(mobile): add body silhouette path and dot tables"
```

---

### Task 2: types + region-param sentinel helpers

**Files:**
- Create: `apps/mobile/src/features/body/schemas/bodyMap.ts`
- Create: `apps/mobile/src/features/body/utils/regionParam.ts`
- Test: `apps/mobile/src/features/body/utils/regionParam.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/features/body/utils/regionParam.test.ts
import { describe, it, expect } from 'vitest';
import { regionParamToCode, codeToRegionParam } from './regionParam';

describe('regionParam', () => {
  it('maps the "general" param to a null region code', () => {
    expect(regionParamToCode('general')).toBeNull();
  });
  it('passes a real region code through unchanged', () => {
    expect(regionParamToCode('knee-right')).toBe('knee-right');
  });
  it('maps a null region code to the "general" param', () => {
    expect(codeToRegionParam(null)).toBe('general');
  });
  it('passes a real region code through to a param unchanged', () => {
    expect(codeToRegionParam('knee-right')).toBe('knee-right');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/mobile test src/features/body/utils/regionParam.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// apps/mobile/src/features/body/utils/regionParam.ts

/** Route-param sentinel for region-less ("General") entries. */
export const GENERAL_PARAM = 'general';

/** Route param -> region code. The 'general' sentinel becomes null (region_code IS NULL). */
export function regionParamToCode(param: string): string | null {
  return param === GENERAL_PARAM ? null : param;
}

/** Region code -> route param. A null code (General) becomes the 'general' sentinel. */
export function codeToRegionParam(code: string | null): string {
  return code === null ? GENERAL_PARAM : code;
}
```

```ts
// apps/mobile/src/features/body/schemas/bodyMap.ts

/** A placed region marker with its display label and lit state. */
export interface Dot {
  code: string;
  label: string;
  cx: number;
  cy: number;
  lit: boolean;
}

/** The full body-map view model for one profile. */
export interface BodyMap {
  front: Dot[];
  back: Dot[];
  generalCount: number;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/mobile test src/features/body/utils/regionParam.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/body/schemas apps/mobile/src/features/body/utils
git commit -m "feat(mobile): add body map types and region-param sentinel helpers"
```

---

### Task 3: buildBodyMap provider

**Files:**
- Create: `apps/mobile/src/features/body/services/providers/bodyMap.provider.ts`
- Test: `apps/mobile/src/features/body/services/providers/bodyMap.provider.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/features/body/services/providers/bodyMap.provider.test.ts
import { describe, it, expect } from 'vitest';
import { buildBodyMap } from './bodyMap.provider';
import type { BodyRegion } from '@med-history/core';

const regions: BodyRegion[] = [
  { code: 'knee-right', label: 'Right Knee', zone: 'leg', side: 'right' },
  { code: 'chest', label: 'Chest', zone: 'torso', side: null },
  { code: 'upper-back', label: 'Upper Back', zone: 'torso', side: null },
];

describe('buildBodyMap', () => {
  it('lights regions that have entries and leaves others dim', () => {
    const counts = new Map<string | null, number>([['knee-right', 2]]);
    const { front } = buildBodyMap(regions, counts);
    const knee = front.find((d) => d.code === 'knee-right');
    const chest = front.find((d) => d.code === 'chest');
    expect(knee?.lit).toBe(true);
    expect(knee?.label).toBe('Right Knee');
    expect(chest?.lit).toBe(false);
  });

  it('counts general (null) entries separately', () => {
    const counts = new Map<string | null, number>([[null, 3]]);
    expect(buildBodyMap(regions, counts).generalCount).toBe(3);
  });

  it('places back-only regions on the back view only', () => {
    const { front, back } = buildBodyMap(regions, new Map());
    expect(back.some((d) => d.code === 'upper-back')).toBe(true);
    expect(front.some((d) => d.code === 'upper-back')).toBe(false);
  });

  it('falls back to the code when the region has no seeded label', () => {
    const { front } = buildBodyMap([], new Map());
    expect(front.find((d) => d.code === 'chest')?.label).toBe('chest');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/mobile test src/features/body/services/providers/bodyMap.provider.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// apps/mobile/src/features/body/services/providers/bodyMap.provider.ts
import type { BodyRegion } from '@med-history/core';
import { FRONT_DOTS, BACK_DOTS, type DotPosition } from '../../data/bodyDots';
import type { Dot, BodyMap } from '../../schemas/bodyMap';

/**
 * Merge seeded regions and per-region entry counts onto the static dot tables.
 *
 * The dot tables are the canonical set of placed markers; each is joined to its
 * region label (falling back to the code) and lit when it has at least one entry.
 * `generalCount` is the count of region-less (region_code IS NULL) entries.
 */
export function buildBodyMap(
  regions: BodyRegion[],
  counts: Map<string | null, number>,
): BodyMap {
  const labels = new Map(regions.map((r) => [r.code, r.label]));

  const toDot = (d: DotPosition): Dot => ({
    code: d.code,
    label: labels.get(d.code) ?? d.code,
    cx: d.cx,
    cy: d.cy,
    lit: (counts.get(d.code) ?? 0) > 0,
  });

  return {
    front: FRONT_DOTS.map(toDot),
    back: BACK_DOTS.map(toDot),
    generalCount: counts.get(null) ?? 0,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/mobile test src/features/body/services/providers/bodyMap.provider.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/body/services/providers
git commit -m "feat(mobile): add buildBodyMap provider"
```

---

### Task 4: body map coordinator

**Files:**
- Create: `apps/mobile/src/features/body/services/coordinators/bodyMap.coordinator.ts`
- Test: `apps/mobile/src/features/body/services/coordinators/bodyMap.coordinator.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/features/body/services/coordinators/bodyMap.coordinator.test.ts
import { describe, it, expect } from 'vitest';
import { makeBodyMapCoordinator, type BodyMapPort } from './bodyMap.coordinator';
import type { BodyRegion } from '@med-history/core';

const regions: BodyRegion[] = [
  { code: 'knee-right', label: 'Right Knee', zone: 'leg', side: 'right' },
];

function fakePort(over: Partial<BodyMapPort> = {}): BodyMapPort {
  return {
    listRegions: async () => regions,
    countsByRegion: async () => new Map<string | null, number>([['knee-right', 1]]),
    ...over,
  };
}

describe('body map coordinator', () => {
  it('loads a built map with lit regions', async () => {
    const c = makeBodyMapCoordinator(fakePort());
    const r = await c.loadMap('p1');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.front.find((d) => d.code === 'knee-right')?.lit).toBe(true);
    }
  });

  it('wraps thrown errors as err', async () => {
    const c = makeBodyMapCoordinator(
      fakePort({ listRegions: async () => { throw new Error('db down'); } }),
    );
    const r = await c.loadMap('p1');
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @med-history/mobile test src/features/body/services/coordinators/bodyMap.coordinator.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// apps/mobile/src/features/body/services/coordinators/bodyMap.coordinator.ts
import type { BodyRegion } from '@med-history/core';
import { ok, err, type Result } from '@/lib/result';
import { buildBodyMap } from '../providers/bodyMap.provider';
import type { BodyMap } from '../../schemas/bodyMap';

/** The slice of core this coordinator drives to assemble the body map. */
export interface BodyMapPort {
  listRegions(): Promise<BodyRegion[]>;
  countsByRegion(profileId: string): Promise<Map<string | null, number>>;
}

export function makeBodyMapCoordinator(port: BodyMapPort) {
  async function loadMap(profileId: string): Promise<Result<BodyMap>> {
    try {
      const [regions, counts] = await Promise.all([
        port.listRegions(),
        port.countsByRegion(profileId),
      ]);
      return ok(buildBodyMap(regions, counts));
    } catch (e) {
      return err((e as Error).message);
    }
  }

  return { loadMap };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @med-history/mobile test src/features/body/services/coordinators/bodyMap.coordinator.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/body/services/coordinators
git commit -m "feat(mobile): add body map coordinator returning Result"
```

---

> **Tasks 5–13 are RN/Expo: verify with `tsc --noEmit` only. Do not claim runtime success.**

### Task 5: repository + wired coordinator instance + query keys

**Files:**
- Create: `apps/mobile/src/features/body/repositories/bodyMap.repository.ts`
- Create: `apps/mobile/src/features/body/services/coordinators/bodyMap.coordinator.instance.ts`
- Create: `apps/mobile/src/features/body/queryKeys.ts`

> The wired instance lives in its OWN module (not in `bodyMap.coordinator.ts`) so the pure
> coordinator test never transitively imports the expo-sqlite repository.

- [ ] **Step 1: Implement**

```ts
// apps/mobile/src/features/body/repositories/bodyMap.repository.ts
import { getDatabase } from '@/lib/db/database';
import type { BodyMapPort } from '../services/coordinators/bodyMap.coordinator';

/** Device-backed body-map port: resolves the singleton DB then delegates to core. */
export const bodyMapRepository: BodyMapPort = {
  async listRegions() {
    return (await getDatabase()).regions.list();
  },
  async countsByRegion(profileId) {
    return (await getDatabase()).entries.countsByRegion(profileId);
  },
};
```

```ts
// apps/mobile/src/features/body/services/coordinators/bodyMap.coordinator.instance.ts
import { makeBodyMapCoordinator } from './bodyMap.coordinator';
import { bodyMapRepository } from '../../repositories/bodyMap.repository';

/** App-wide body-map coordinator wired to the device-backed repository. */
export const bodyMapCoordinator = makeBodyMapCoordinator(bodyMapRepository);
```

```ts
// apps/mobile/src/features/body/queryKeys.ts
export const bodyKeys = {
  all: ['body'] as const,
  map: (profileId: string) => [...bodyKeys.all, 'map', profileId] as const,
};
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/body/repositories apps/mobile/src/features/body/services/coordinators/bodyMap.coordinator.instance.ts apps/mobile/src/features/body/queryKeys.ts
git commit -m "feat(mobile): add body map repository, wired coordinator, query keys"
```

---

### Task 6: useBodyMap hook

**Files:**
- Create: `apps/mobile/src/features/body/hooks/useBodyMap.hook.ts`

- [ ] **Step 1: Implement**

```ts
// apps/mobile/src/features/body/hooks/useBodyMap.hook.ts
import { useQuery } from '@tanstack/react-query';
import { bodyMapCoordinator } from '../services/coordinators/bodyMap.coordinator.instance';
import { bodyKeys } from '../queryKeys';

export function useBodyMap(profileId: string) {
  const query = useQuery({
    queryKey: bodyKeys.map(profileId),
    queryFn: async () => {
      const r = await bodyMapCoordinator.loadMap(profileId);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    enabled: profileId.length > 0,
    staleTime: Infinity,
  });
  return {
    bodyMap: query.data ?? null,
    loading: query.isLoading,
    error: query.isError ? (query.error as Error).message : null,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/body/hooks
git commit -m "feat(mobile): add useBodyMap hook"
```

---

### Task 7: theme tokens (figureStroke, dotDim)

**Files:**
- Modify: `apps/mobile/src/constants/theme.ts`

- [ ] **Step 1: Add two tokens to BOTH palette blocks**

In `apps/mobile/src/constants/theme.ts`, the `palette` object has a `light` and a `dark` block. Add these as the last keys of each block (after the existing `textOnAccent`):

In `light`:
```ts
    figureStroke: '#7c8aa0',
    dotDim: '#b8bdc7',
```

In `dark`:
```ts
    figureStroke: '#a5cfe8',
    dotDim: '#2a3448',
```

Do not change anything else (the `Colors`/`Theme` types derive from the palette automatically).

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/constants/theme.ts
git commit -m "feat(mobile): add figureStroke and dotDim theme tokens"
```

---

### Task 8: bodySilhouette + regionDot components

**Files:**
- Create: `apps/mobile/src/features/body/components/bodySilhouette.component.tsx`
- Create: `apps/mobile/src/features/body/components/regionDot.component.tsx`

> These are `react-native-svg` elements styled via SVG props (fill/stroke), not RN style
> objects, so they need no `.styles.ts` file. The lit halo uses the accent color at low
> `fillOpacity` (no extra token). The hit circle uses `fill="transparent"`, which hit-tests on
> iOS (our on-device target). Hit radius is larger than the visual dot and scales physically
> because the whole `<Svg>` is sized by `figureScale` in the container.

- [ ] **Step 1: Implement regionDot**

```tsx
// apps/mobile/src/features/body/components/regionDot.component.tsx
import { Circle, G } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme.hook';
import type { Dot } from '../schemas/bodyMap';

/** One region marker: an enlarged transparent hit area, an optional lit halo, and the dot. */
export function RegionDot({ dot, onPress }: { dot: Dot; onPress: () => void }) {
  const theme = useTheme();
  return (
    <G onPress={onPress}>
      <Circle cx={dot.cx} cy={dot.cy} r={7} fill="transparent" />
      {dot.lit && (
        <Circle cx={dot.cx} cy={dot.cy} r={4.2} fill={theme.colors.accent} fillOpacity={0.22} />
      )}
      <Circle
        cx={dot.cx}
        cy={dot.cy}
        r={dot.lit ? 2.4 : 1.8}
        fill={dot.lit ? theme.colors.accent : theme.colors.dotDim}
      />
    </G>
  );
}
```

- [ ] **Step 2: Implement bodySilhouette**

```tsx
// apps/mobile/src/features/body/components/bodySilhouette.component.tsx
import type { ReactNode } from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme.hook';
import { SILHOUETTE_PATH, BODY_VIEWBOX } from '../data/silhouette';

/** The square figure canvas: the outline path plus any dot children, sized by the caller. */
export function BodySilhouette({ size, children }: { size: number; children: ReactNode }) {
  const theme = useTheme();
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${BODY_VIEWBOX} ${BODY_VIEWBOX}`}>
      <Path
        d={SILHOUETTE_PATH}
        fill="none"
        stroke={theme.colors.figureStroke}
        strokeWidth={0.9}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {children}
    </Svg>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/body/components/bodySilhouette.component.tsx apps/mobile/src/features/body/components/regionDot.component.tsx
git commit -m "feat(mobile): add body silhouette and region dot SVG components"
```

---

### Task 9: bodyViewToggle + generalControl components

**Files:**
- Create: `apps/mobile/src/features/body/components/bodyViewToggle.component.tsx`
- Create: `apps/mobile/src/features/body/components/bodyViewToggle.styles.ts`
- Create: `apps/mobile/src/features/body/components/generalControl.component.tsx`
- Create: `apps/mobile/src/features/body/components/generalControl.styles.ts`

- [ ] **Step 1: Implement bodyViewToggle**

```ts
// apps/mobile/src/features/body/components/bodyViewToggle.styles.ts
import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeBodyViewToggleStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.bgElement,
      borderRadius: theme.radius.md,
      padding: theme.spacing.xs,
      alignSelf: 'center',
    },
    segment: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.sm,
    },
    segmentSelected: {
      backgroundColor: theme.colors.bgSelected,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.footnote,
      fontWeight: '600',
    },
    labelSelected: {
      color: theme.colors.textPrimary,
    },
  });
```

```tsx
// apps/mobile/src/features/body/components/bodyViewToggle.component.tsx
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { makeBodyViewToggleStyles } from './bodyViewToggle.styles';

export type BodyView = 'front' | 'back';

export function BodyViewToggle({
  view,
  onChange,
}: {
  view: BodyView;
  onChange: (view: BodyView) => void;
}) {
  const theme = useTheme();
  const styles = makeBodyViewToggleStyles(theme);
  return (
    <View style={styles.row}>
      {(['front', 'back'] as BodyView[]).map((opt) => {
        const selected = opt === view;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {opt === 'front' ? 'Front' : 'Back'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Implement generalControl**

```ts
// apps/mobile/src/features/body/components/generalControl.styles.ts
import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeGeneralControlStyles = (theme: Theme) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      alignSelf: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.bgElement,
    },
    pillLit: {
      borderColor: theme.colors.accent,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.dotDim,
    },
    indicatorLit: {
      backgroundColor: theme.colors.accent,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.footnote,
      fontWeight: '600',
    },
    labelLit: {
      color: theme.colors.textPrimary,
    },
  });
```

```tsx
// apps/mobile/src/features/body/components/generalControl.component.tsx
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { makeGeneralControlStyles } from './generalControl.styles';

/** Always-present control for region-less ("General") entries; lit when it holds any. */
export function GeneralControl({ lit, onPress }: { lit: boolean; onPress: () => void }) {
  const theme = useTheme();
  const styles = makeGeneralControlStyles(theme);
  return (
    <Pressable onPress={onPress} style={[styles.pill, lit && styles.pillLit]}>
      <View style={[styles.indicator, lit && styles.indicatorLit]} />
      <Text style={[styles.label, lit && styles.labelLit]}>General</Text>
    </Pressable>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/body/components/bodyViewToggle.component.tsx apps/mobile/src/features/body/components/bodyViewToggle.styles.ts apps/mobile/src/features/body/components/generalControl.component.tsx apps/mobile/src/features/body/components/generalControl.styles.ts
git commit -m "feat(mobile): add body view toggle and general control components"
```

---

### Task 10: bodyScreen container

**Files:**
- Create: `apps/mobile/src/features/body/containers/bodyScreen.container.tsx`
- Create: `apps/mobile/src/features/body/containers/bodyScreen.styles.ts`

> Composes `useBodyMap` (dots) with a read of `useProfiles` (header name/age) — the one
> intentional cross-feature read. Reads the route param itself so the screen stays a pure
> one-container render. Header has a back chevron, name + age, and a settings icon.

- [ ] **Step 1: Implement the styles**

```ts
// apps/mobile/src/features/body/containers/bodyScreen.styles.ts
import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeBodyScreenStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.bgApp },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    headerText: { flex: 1 },
    name: { color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '700' },
    meta: { color: theme.colors.textSecondary, fontSize: theme.text.footnote },
    iconButton: { padding: theme.spacing.sm },
    iconGlyph: { color: theme.colors.textSecondary, fontSize: theme.text.title },
    backGlyph: { color: theme.colors.textPrimary, fontSize: theme.text.largeTitle },
    scroll: { alignItems: 'center', gap: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
    hint: { color: theme.colors.textSecondary, fontSize: theme.text.footnote, textAlign: 'center' },
    figureWrap: { alignItems: 'center', justifyContent: 'center' },
  });
```

- [ ] **Step 2: Implement the container**

```tsx
// apps/mobile/src/features/body/containers/bodyScreen.container.tsx
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme.hook';
import { useProfiles } from '@/features/profiles/hooks/useProfiles.hook';
import { calcAge } from '@/features/profiles/utils/date';
import { useBodyMap } from '../hooks/useBodyMap.hook';
import { BodySilhouette } from '../components/bodySilhouette.component';
import { RegionDot } from '../components/regionDot.component';
import { BodyViewToggle, type BodyView } from '../components/bodyViewToggle.component';
import { GeneralControl } from '../components/generalControl.component';
import { makeBodyScreenStyles } from './bodyScreen.styles';

export function BodyScreenContainer() {
  const theme = useTheme();
  const styles = makeBodyScreenStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { profiles } = useProfiles();
  const { bodyMap, loading } = useBodyMap(id ?? '');
  const [view, setView] = useState<BodyView>('front');

  const profile = profiles.find((p) => p.id === id);
  const size = Math.min(width - theme.spacing.lg * 2, 410) * theme.figureScale;
  const dots = view === 'front' ? bodyMap?.front ?? [] : bodyMap?.back ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Text style={styles.backGlyph}>{'‹'}</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.name}>{profile?.name ?? ''}</Text>
          {profile && (
            <Text style={styles.meta}>
              {`Age ${calcAge(profile.dob)} · ${profile.sex === 'female' ? 'Female' : 'Male'}`}
            </Text>
          )}
        </View>
        <Pressable onPress={() => router.push(`/profile/${id}/settings` as any)} style={styles.iconButton}>
          <Text style={styles.iconGlyph}>{'⚙'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.accent} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <BodyViewToggle view={view} onChange={setView} />
          <Text style={styles.hint}>Glowing markers indicate logged history</Text>
          <View style={styles.figureWrap}>
            <BodySilhouette size={size}>
              {dots.map((dot) => (
                <RegionDot
                  key={dot.code}
                  dot={dot}
                  onPress={() => router.push(`/profile/${id}/region/${dot.code}` as any)}
                />
              ))}
            </BodySilhouette>
          </View>
          <GeneralControl
            lit={(bodyMap?.generalCount ?? 0) > 0}
            onPress={() => router.push(`/profile/${id}/region/general` as any)}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/body/containers/bodyScreen.container.tsx apps/mobile/src/features/body/containers/bodyScreen.styles.ts
git commit -m "feat(mobile): add body screen container"
```

---

### Task 11: regionPlaceholder container

**Files:**
- Create: `apps/mobile/src/features/body/containers/regionPlaceholder.container.tsx`
- Create: `apps/mobile/src/features/body/containers/regionPlaceholder.styles.ts`

> Resolves the region label from the same `useBodyMap` data (single-sourced from core), using
> the `'general'` sentinel for region-less entries. Placeholder until the entries feature lands.

- [ ] **Step 1: Implement the styles**

```ts
// apps/mobile/src/features/body/containers/regionPlaceholder.styles.ts
import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeRegionPlaceholderStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.bgApp },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    backGlyph: { color: theme.colors.textPrimary, fontSize: theme.text.largeTitle },
    title: { color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '700' },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.lg,
    },
    bodyText: { color: theme.colors.textSecondary, fontSize: theme.text.body, textAlign: 'center' },
  });
```

- [ ] **Step 2: Implement the container**

```tsx
// apps/mobile/src/features/body/containers/regionPlaceholder.container.tsx
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme.hook';
import { useBodyMap } from '../hooks/useBodyMap.hook';
import { regionParamToCode, GENERAL_PARAM } from '../utils/regionParam';
import { makeRegionPlaceholderStyles } from './regionPlaceholder.styles';

export function RegionPlaceholderContainer() {
  const theme = useTheme();
  const styles = makeRegionPlaceholderStyles(theme);
  const { id, code } = useLocalSearchParams<{ id: string; code: string }>();
  const { bodyMap } = useBodyMap(id ?? '');

  const regionCode = regionParamToCode(code ?? '');
  const label =
    code === GENERAL_PARAM
      ? 'General'
      : [...(bodyMap?.front ?? []), ...(bodyMap?.back ?? [])].find((d) => d.code === regionCode)
          ?.label ?? (code ?? '');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backGlyph}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.title}>{label}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.bodyText}>Entries coming next.</Text>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/body/containers/regionPlaceholder.container.tsx apps/mobile/src/features/body/containers/regionPlaceholder.styles.ts
git commit -m "feat(mobile): add region placeholder container"
```

---

### Task 12: profileSettings container (moves delete here)

**Files:**
- Create: `apps/mobile/src/features/profiles/containers/profileSettings.container.tsx`
- Create: `apps/mobile/src/features/profiles/containers/profileSettings.styles.ts`

> This is the new home for **Delete profile** (lifted from the old `profileDetail.container`).
> It reads the profile via `useProfiles` and deletes via `useDeleteProfile`, then returns to the
> list. Lives in `features/profiles` because it manages profile data.

- [ ] **Step 1: Implement the styles**

```ts
// apps/mobile/src/features/profiles/containers/profileSettings.styles.ts
import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeProfileSettingsStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.bgApp },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    backGlyph: { color: theme.colors.textPrimary, fontSize: theme.text.largeTitle },
    title: { color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '700' },
    content: { flex: 1, padding: theme.spacing.lg, gap: theme.spacing.xs },
    name: { color: theme.colors.textPrimary, fontSize: theme.text.largeTitle, fontWeight: '700' },
    meta: { color: theme.colors.textSecondary, fontSize: theme.text.body },
    footer: { padding: theme.spacing.lg },
    deleteButton: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.danger,
    },
    deleteLabel: { color: theme.colors.danger, fontSize: theme.text.callout, fontWeight: '600' },
  });
```

- [ ] **Step 2: Implement the container**

```tsx
// apps/mobile/src/features/profiles/containers/profileSettings.container.tsx
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme.hook';
import { useProfiles } from '../hooks/useProfiles.hook';
import { useDeleteProfile } from '../hooks/useDeleteProfile.hook';
import { calcAge } from '../utils/date';
import { makeProfileSettingsStyles } from './profileSettings.styles';

export function ProfileSettingsContainer() {
  const theme = useTheme();
  const styles = makeProfileSettingsStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles } = useProfiles();
  const { deleteProfile, deleting } = useDeleteProfile();
  const profile = profiles.find((p) => p.id === id);

  function confirmDelete() {
    if (!profile) return;
    Alert.alert(
      'Delete profile',
      `Delete ${profile.name} and all their history? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProfile(profile.id);
            router.replace('/' as any);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backGlyph}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.title}>Profile settings</Text>
      </View>
      {profile && (
        <View style={styles.content}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.meta}>
            {`Age ${calcAge(profile.dob)} · ${profile.sex === 'female' ? 'Female' : 'Male'}`}
          </Text>
        </View>
      )}
      <View style={styles.footer}>
        <Pressable disabled={deleting} onPress={confirmDelete} style={styles.deleteButton}>
          <Text style={styles.deleteLabel}>Delete profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/profiles/containers/profileSettings.container.tsx apps/mobile/src/features/profiles/containers/profileSettings.styles.ts
git commit -m "feat(mobile): add profile settings container with delete"
```

---

### Task 13: screens + route restructure

**Files:**
- Delete: `apps/mobile/src/app/profile/[id].tsx`
- Delete: `apps/mobile/src/features/profiles/containers/profileDetail.container.tsx`
- Delete: `apps/mobile/src/features/profiles/containers/profileDetail.styles.ts`
- Create: `apps/mobile/src/app/profile/[id]/index.tsx`
- Create: `apps/mobile/src/app/profile/[id]/settings.tsx`
- Create: `apps/mobile/src/app/profile/[id]/region/[code].tsx`

> Expo Router: turning `[id].tsx` into the folder `[id]/` with an `index.tsx` keeps the same
> `/profile/:id` URL while allowing `settings` and `region/[code]` to nest under it. The old
> `profileDetail` container/styles are now unused and removed. `app/profile/new.tsx` and
> `app/_layout.tsx` (the `profile/new` modal declaration) are unchanged.

- [ ] **Step 1: Remove the old screen and its now-unused container**

```bash
git rm apps/mobile/src/app/profile/[id].tsx
git rm apps/mobile/src/features/profiles/containers/profileDetail.container.tsx
git rm apps/mobile/src/features/profiles/containers/profileDetail.styles.ts
```

- [ ] **Step 2: Create the body (index) screen**

```tsx
// apps/mobile/src/app/profile/[id]/index.tsx
import { BodyScreenContainer } from '@/features/body/containers/bodyScreen.container';

export default function ProfileBodyScreen() {
  return <BodyScreenContainer />;
}
```

- [ ] **Step 3: Create the settings screen**

```tsx
// apps/mobile/src/app/profile/[id]/settings.tsx
import { ProfileSettingsContainer } from '@/features/profiles/containers/profileSettings.container';

export default function ProfileSettingsScreen() {
  return <ProfileSettingsContainer />;
}
```

- [ ] **Step 4: Create the region placeholder screen**

```tsx
// apps/mobile/src/app/profile/[id]/region/[code].tsx
import { RegionPlaceholderContainer } from '@/features/body/containers/regionPlaceholder.container';

export default function RegionScreen() {
  return <RegionPlaceholderContainer />;
}
```

- [ ] **Step 5: Typecheck + full test suite**

Run: `pnpm --filter @med-history/mobile exec tsc --noEmit`
Expected: exit 0. (If any route literal errors, add an `as any` cast — already applied in the containers.)
Run: `pnpm --filter @med-history/mobile test`
Expected: all pure tests pass (profiles + body).

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/app/profile
git commit -m "feat(mobile): wire body screen, settings, and region routes under profile/[id]"
```

---

### Task 14: On-device verification (manual)

**Files:** none.

- [ ] **Step 1:** Run (from `apps/mobile`): `npx expo start -c`; open in Expo Go (SDK 54).
- [ ] **Step 2:** Verify each:
  - Tapping a profile opens the **body screen**: silhouette with dots, a **Front/Back** toggle, the "Glowing markers…" hint, and a **General** pill below.
  - With no entries yet, all dots are **dim** and General is **unlit** (expected — entries aren't built).
  - The **Front/Back** toggle swaps the dot set (back shows upper-back, glutes, hamstrings, calves).
  - Tapping any dot opens its **region placeholder** screen titled with the region name (e.g. "Right Knee") + "Entries coming next"; back returns to the body screen.
  - Tapping **General** opens the placeholder titled "General".
  - The header **⚙ settings** icon opens **Profile settings**; **Delete profile** → confirm alert → profile removed → returns to the list.
  - Increasing the size level (Settings/onboarding) enlarges the figure and dots; when tall, the body screen **scrolls** rather than shrinking.
  - **Fully close + relaunch** → profiles persist; onboarding does not reappear.
- [ ] **Step 3:** If all pass: `git commit --allow-empty -m "test(mobile): verified body screen flow on device"`. Otherwise capture the error and fix in the relevant task.

---

## Self-review

**Spec coverage:**
- New `features/body` data-owning feature → Tasks 1–11. ✓
- One neutral silhouette (front+back, both sexes) → Tasks 1, 8. ✓
- All dots shown, lit when `count>0`, dim otherwise → Tasks 3 (lit flag), 8 (dim/lit render), 10 (render all). ✓
- Static glow halo, no animation → Task 8. ✓
- Tap navigates directly; enlarged hit target scaling with figureScale → Tasks 8 (r=7 hit circle), 10 (SVG sized by figureScale). ✓
- General control, always present, lit/unlit → Tasks 9, 10. ✓
- Front/Back toggle → Tasks 9, 10. ✓
- Placeholder region screen via `/profile/[id]/region/[code]`, `general` sentinel → Tasks 2, 11, 13. ✓
- Delete moved to a profile-settings screen → Tasks 12, 13. ✓
- Route restructure `[id].tsx` → `[id]/index.tsx` + nested routes → Task 13. ✓
- `Result` coordinator + react-query hook (`staleTime: Infinity`) → Tasks 4, 5, 6. ✓
- Region labels single-sourced from core; counts from `entries.countsByRegion` → Tasks 3, 5. ✓
- vitest for provider, coordinator, sentinel helpers → Tasks 2, 3, 4. ✓
- Sizing/scroll per data-model spec → Task 10. ✓
- Theme tokens, no hardcoded hex in components → Tasks 7, 9, 10, 11, 12. ✓

**Placeholder scan:** No TBD/"add validation" placeholders; every code step is complete. "Entries coming next" is intentional product copy. UI tasks state typecheck-only verification with on-device checks in Task 14.

**Type consistency:** `BodyMapPort` (listRegions/countsByRegion) consistent across coordinator (T4), repository (T5). `BodyMap`/`Dot` (T2) are produced by `buildBodyMap` (T3), returned by `loadMap` (T4), consumed by `useBodyMap` (T6) and the containers (T10, T11). `bodyKeys.map(profileId)` (T5) used by the hook (T6). `BodyView` ('front'|'back') consistent across the toggle (T9) and container (T10). `regionParamToCode`/`codeToRegionParam`/`GENERAL_PARAM` (T2) used by the region placeholder (T11) and the General route literal (T10). `figureStroke`/`dotDim` tokens (T7) used by the SVG components (T8) and controls (T9). `BodyScreenContainer`/`ProfileSettingsContainer`/`RegionPlaceholderContainer` exports match the screen imports (T13).

## Note (next plan)
The region placeholder (`/profile/[id]/region/[code]`) is replaced by the real **entries** feature next — the Visits / Notes / Prescriptions / Imaging & Tests tabbed list and entry creation — which will write `entries` and invalidate `bodyKeys` so the body dots light up. It reuses `regionParamToCode`, `useBodyMap`, and the established feature patterns.
