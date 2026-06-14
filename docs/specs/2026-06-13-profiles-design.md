# Profiles Feature — Design

> Status: approved design, pending spec review.
> Date: 2026-06-13
> Branch: `feat/profiles` (stacked on `feat/onboarding-appearance`)

## Purpose

The first real medical-history UI: list the people tracked on this device, add a new profile,
and delete one. Replaces the placeholder home screen and establishes the navigation into a
per-profile screen (the body screen slots in next). Consumes the `profiles` repository already
built in `packages/core`.

Builds on the app shell, providers, theme/appearance system, and feature patterns from
`docs/specs/2026-06-13-onboarding-appearance-design.md`. Grounded in `docs/mockups/index.html`.

## Decisions (approved)

- **Scope:** list + create + delete (edit deferred).
- **Date of birth:** native OS date picker (`@react-native-community/datetimepicker` via `expo install`).
- **Tap target:** navigate to a placeholder `/profile/[id]` screen (establishes the route + id passing now).
- **Delete:** lives on the `/profile/[id]` screen behind an `Alert` confirm (safer/clearer than swipe).
- **Active profile:** none persisted — the id rides the route param (like the mock's `?user=`).

## Feature structure (`apps/mobile/src/features/profiles/`, per mobile.md)

```
features/profiles/
  repositories/profiles.repository.ts    # ProfilesPort over getDatabase().profiles
  services/coordinators/profiles.coordinator.ts   # Result<T>: loadAll / create / remove
  hooks/useProfiles.hook.ts              # react-query read (list)
  hooks/useCreateProfile.hook.ts         # mutation → invalidate
  hooks/useDeleteProfile.hook.ts         # mutation → invalidate
  queryKeys.ts                           # profilesKeys
  utils/calcAge.ts                       # pure calcAge(dob, now?) — vitest
  schemas/profileForm.ts                 # form schema (name, dob ≤ today, sex)
  components/profileAvatar.component.tsx  # head+shoulders silhouette, male/female
  components/profileCard.component.tsx    # avatar + name + "Age N · Sex" + chevron
  components/addProfileForm.component.tsx # name field, date picker, sex selector
  components/profilesEmptyState.component.tsx
  containers/profiles.container.tsx       # list/empty + add button (rendered by app/index)
```

Reuses from `features/settings`: `Result`/`ok`/`err`, the segmented-control pattern (the
sex selector mirrors `ThemeSelector`), `useTheme` + `makeStyles(theme)` styling.

## Data layer

`ProfilesPort` (the slice of core's `profiles` repo the coordinator drives):
```ts
interface ProfilesPort {
  list(): Promise<Profile[]>;
  create(input: CreateProfileInput): Promise<Profile>;
  remove(id: string): Promise<void>;
}
```
`profilesRepository` implements it via `(await getDatabase()).profiles`.

`makeProfilesCoordinator(port)` returns `Result`-wrapped `loadAll()`, `create(input)`, `remove(id)`
(try/catch → `ok`/`err`, mirroring the settings coordinator). Unit-tested with a fake port.

Hooks (react-query, `staleTime: Infinity`, invalidate `profilesKeys.all` on writes):
- `useProfiles()` → `{ profiles, loading, error }`.
- `useCreateProfile()` → `{ createProfile, saving }`.
- `useDeleteProfile()` → `{ deleteProfile, deleting }`.

## Screens (Expo Router)

- **`app/index.tsx`** → renders `<ProfilesContainer/>` (screen renders one container, per mobile.md).
  - Loading → spinner; empty → `profilesEmptyState` ("No profiles yet" + prompt); else a list of
    `profileCard`s. A primary "Add profile" button routes to `/profile/new`.
  - Tapping a card → `router.push('/profile/' + id)`.
- **`app/profile/new.tsx`** → presented as a **modal** (Stack screen `presentation: 'modal'`).
  Renders `addProfileForm`: name (TextInput), DOB (date picker), sex (Male/Female selector).
  Save → validate (`profileForm` schema) → `createProfile` → on success `router.back()`.
  Cancel → `router.back()`.
- **`app/profile/[id].tsx`** → reads `id` from `useLocalSearchParams` and finds the profile in the
  cached `useProfiles()` list (the list is react-query–cached with `staleTime: Infinity`, and the
  screen is only reached from the list, so it's always populated — no extra `get` needed). Shows
  avatar + name + "Age N · Sex", a "Body screen coming next" stub, and a **"Delete profile"** button
  → `Alert.alert` confirm → `deleteProfile(id)` → `router.replace('/')`.

The `app/profile/_layout.tsx` Stack declares `new` as a modal and `[id]` as a normal screen.

## Validation & error handling

- `profileForm` schema: `name` non-empty (trimmed); `sex` ∈ {male, female}; `dob` formatted
  `YYYY-MM-DD` and **not in the future** (refine `dob <= today`). The date picker caps `maximumDate`
  at today and defaults to a sensible past date (e.g. 1980-01-01) so the wheel doesn't start at today.
- Form surfaces field errors inline; the Save button is disabled until name + dob are set.
- Coordinator wraps any DB failure as `err`; the screen shows the message (the on-device path
  shouldn't fail, but the boundary is honored).
- `calcAge(dob, now)` takes an optional `now` for deterministic tests; defaults to current date in the app.

## Avatar

`profileAvatar` renders a head-and-shoulders silhouette in a circle via `react-native-svg`, with a
`sex` prop selecting the male vs female variant (female adds the hairline path, as in the mock's
`avatarSvg`). Colors from `theme.colors`; size scales with `theme.figureScale` so it respects the
accessibility size setting.

## Testing

- **vitest (pure):** `calcAge` (birthday-not-yet-passed edge cases, leap years) and the profiles
  coordinator (`loadAll`/`create`/`remove` ok + error wrapping) with a fake port.
- **Manual on-device:** add a profile (name + DOB via picker + sex), see it in the list with the
  right age; relaunch → it persists; tap → placeholder profile screen; delete → confirm → gone.

## Out of scope (later)

- Edit profile (repo supports `update`; add when an edit screen is built).
- The real body screen (the `/profile/[id]` placeholder is replaced next).
- Avatar customization / photos.
