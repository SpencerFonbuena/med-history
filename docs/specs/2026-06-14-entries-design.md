# MedHistory — Entries Design

> Status: approved design, pending spec review.
> Date: 2026-06-14
> Fills in the `/profile/[id]/region/[code]` placeholder shipped with the Body Screen feature.

## Purpose

Give each profile a real medical history per body region: a tabbed list of **Visits / Notes /
Prescriptions / Imaging & Tests** with full create / view / edit / delete, reached by tapping a
region dot (or the General control) on the body screen. Creating or deleting an entry relights the
body dots via `countsByRegion` invalidation.

Grounded in the mockup `docs/mockups/part.html` (header + four tabs + per-tab entry cards + per-tab
empty states + a FAB that opens an add-entry modal with type-specific extra fields) and core's
`entries` repository (`create`, per-type `listByRegion`/`listGeneral`, `countsByRegion`, `remove`).

## Decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Operations | **Full CRUD** (add / view / edit / delete) | Entries are long-lived records; mistakes must be fixable. Requires adding `update` to core (schema already exists). |
| 2 | Imaging & Tests scope | **`facility` + an Imaging/Lab `subtype` toggle**; NO attachments | Exercises `subtype`; attachments (Expo FileSystem + document picker + files-on-disk) are their own later feature. |
| 3 | Add/edit/delete UI | **Route modals**: FAB → add modal; tap a card → edit modal (pre-filled) with a Delete button; one shared `EntryForm` | Consistent with the new-profile modal; no swipe-gesture dependency. |
| 4 | Region label | **Passed as a navigation param** from the body screen (`General` for the general control); falls back to the raw code | The body screen already holds each dot's label; avoids a regions read here and any cross-feature coupling. The body screen is the only entry path. |

## Core change first (`packages/core`)

Full CRUD needs an `update` method on the entries repository (it currently has none; `profiles`
already has the equivalent).

- Add `update(id: string, input: UpdateEntryInput): Promise<Entry>` to
  `packages/core/src/repositories/entries.repository.ts`: parse with the existing `updateEntryInput`
  schema, build a dynamic `SET` clause from the provided fields plus `updated_at = now`, run the
  `UPDATE`, re-`get(id)`, and throw `entry ${id} not found` if it does not exist. Mirror the shape of
  `profiles.update`. Note `details` serializes to JSON like `create`.
- Export `updateEntryInput` and `type UpdateEntryInput` from `packages/core/src/index.ts` (the schema
  is defined in `entry.schema.ts` but not currently exported).
- vitest test: create → update a single field → assert the field changed and the others are untouched.

This is the first task of the plan, on the same `feat/entries` branch.

## Architecture — new `features/entries`

> **`features/entries`** — *owns a profile's entries: the per-region tabbed history and entry
> create / edit / delete.*

```
src/features/entries/
  schemas/entryForm.ts                              # zod form schema (date, title, body required; optional extras; subtype)
  utils/entryDate.ts                                # formatEntryDate (pure)
  services/providers/entryTypes.provider.ts         # tab metadata, extras-per-type, form→core-input builders (pure)
  services/coordinators/entries.coordinator.ts      # EntriesPort + Result coordinator (list/get/create/update/remove)
  services/coordinators/entries.coordinator.instance.ts  # wired singleton (repo + coordinator)
  repositories/entries.repository.ts                # EntriesPort over getDatabase().entries
  queryKeys.ts                                      # entriesKeys
  hooks/useRegionEntries.hook.ts                    # active-tab list read
  hooks/useEntry.hook.ts                            # one entry (edit prefill)
  hooks/useCreateEntry.hook.ts
  hooks/useUpdateEntry.hook.ts
  hooks/useDeleteEntry.hook.ts
  components/entryCard.component.tsx
  components/entryCard.styles.ts
  components/entryList.component.tsx                 # list + per-tab empty state
  components/entryList.styles.ts
  components/entryTypeTabs.component.tsx
  components/entryTypeTabs.styles.ts
  components/entryForm.component.tsx                 # shared add/edit form
  components/entryForm.styles.ts
  containers/regionEntries.container.tsx             # region screen
  containers/regionEntries.styles.ts
  containers/newEntry.container.tsx                  # add modal
  containers/editEntry.container.tsx                 # edit modal (Save + Delete)
  containers/entryModal.styles.ts                    # shared modal-screen chrome for new/edit
```

Removed: `features/body/containers/regionPlaceholder.container.tsx` and `regionPlaceholder.styles.ts`
(replaced by `regionEntries`).

### Cross-feature touchpoints (intentional, noted)

- Entry mutation hooks import `bodyKeys` from `features/body` to invalidate the body dots.
- The region label arrives as a navigation param from the body screen — no regions read here.

## Data flow

```
regionEntries.container  (route params: id, code, label)
  ├─ header title = label (param); 'General' when code === 'general'
  ├─ entryTypeTabs: local state activeType: EntryType (default 'visit')
  └─ useRegionEntries(id, code, activeType)        → useQuery, staleTime: Infinity
        coordinator.list(profileId, regionCode, type)        → Result<Entry[]>
          regionCode = regionParamToCode(code)               // 'general' → null  (reused from features/body)
          port.list → code===null ? entries.listGeneral(id, type) : entries.listByRegion(id, code, type)

FAB        → router.push(`/profile/${id}/region/${code}/new?type=${activeType}&label=${label}`)
tap card   → router.push(`/profile/${id}/region/${code}/${entryId}?label=${label}`)

newEntry.container   → EntryForm (blank; type from param) → useCreateEntry
                         create → await invalidate(entriesKeys.all) + invalidate(bodyKeys.all) → router.back()
editEntry.container  → useEntry(entryId) prefills EntryForm → useUpdateEntry
                         update → await invalidate(entriesKeys.all) → router.back()
                       Delete → useDeleteEntry → remove
                         → await invalidate(entriesKeys.all) + invalidate(bodyKeys.all) → router.back()
```

- **Invalidation:** create + delete change region counts → invalidate `entriesKeys.all` **and**
  `bodyKeys.all` (dots relight). Update keeps the same region/type/count → `entriesKeys.all` only.
  Every mutation `onSuccess` **awaits** the invalidation so a screen that navigates after the write
  reads fresh data.
- `regionParamToCode` is imported from `features/body/utils/regionParam` (the existing sentinel
  helper). This is the second small, read-only cross-feature reuse.
- Each tab is its own cached query keyed by `(profileId, code, type)`; switching tabs swaps queries.
- `entriesKeys = { all: ['entries'], list: (profileId, code, type) => [...all,'list',profileId,code,type], detail: (id) => [...all,'detail',id] }`.

## Screens & routes (Expo Router restructure)

`region/[code].tsx` becomes a folder so the add/edit modals can nest under it (same pattern used for
`[id]` in the Body Screen feature):

| Route | Renders | Presentation |
|---|---|---|
| `app/profile/[id]/region/[code]/index.tsx` | `<RegionEntriesContainer/>` | normal (replaces the old `[code].tsx`) |
| `app/profile/[id]/region/[code]/new.tsx` | `<NewEntryContainer/>` | modal |
| `app/profile/[id]/region/[code]/[entryId].tsx` | `<EditEntryContainer/>` | modal |

- The two modals are declared in `app/_layout.tsx`'s `Stack` (alongside the existing `profile/new`
  modal) with `options={{ presentation: 'modal' }}`.
- The body screen's dot/General navigation is updated to append `&label=${encodeURIComponent(label)}`
  (`label=General` for the General control), so the region screen and the entry modals can title
  themselves without a lookup.
- Each screen renders exactly one container (`mobile.md`). Route literals use `as any` casts (typed
  routes regenerate on `expo start`), consistent with the rest of the app.

## Form & validation

- **`entryForm` (zod):** `date` matches `^\d{4}-\d{2}-\d{2}$`; `title` and `body` are `z.string().trim().min(1)`;
  `doctor`, `diagnosis`, `prescriber`, `duration`, `facility` are optional trimmed strings; `subtype`
  is an optional `z.enum(['imaging','lab'])`. No future-date cap (a visit/appointment can be upcoming).
  Type lives outside the schema (it is fixed by the tab/route, not user-entered in the form).
- **`EntryForm` component:** native date picker (reuse `@react-native-community/datetimepicker`,
  default = today, no `maximumDate`), a title `TextInput`, a multiline body `TextInput`, then
  **type-driven extras**:
  - `visit` → doctor, diagnosis
  - `note` → none
  - `prescription` → prescriber, duration
  - `imaging_test` → facility **+ an Imaging/Lab subtype segmented toggle**
  Add mode renders a Save button; edit mode renders Save **and** a destructive Delete (confirmed via
  `Alert`). The component takes `type`, optional `initial` values, `submitting`, `onSubmit`, and
  (edit only) `onDelete`.
- **`entryTypes.provider` (pure):**
  - `ENTRY_TABS`: ordered `{ type, label, emptyIcon, emptyMessage }` for the four types
    (labels and empty states from the mock: Visits 🩺, Notes 📝, Prescriptions 💊, Imaging & Tests 🩻).
  - `extrasFor(type)`: the ordered extra field keys for that type.
  - `buildCreateInput(profileId, regionCode, type, values)`: form values → `CreateEntryInput`,
    dropping empty-string optionals and attaching `subtype` only when `type === 'imaging_test'`.
  - `buildUpdateInput(type, values)`: form values → `UpdateEntryInput` (same dropping rules).

## Testing

- **vitest (pure):**
  - core `entries.update` (create → update one field → assert changed + untouched).
  - `entryDate.formatEntryDate` (e.g. `'2026-01-02'` → human form).
  - `entryTypes.provider` (`extrasFor` per type; `subtype` only on `imaging_test`; empty optionals
    dropped by the input builders).
  - `entries.coordinator` (region vs General routing via a fake `EntriesPort`; `Result` ok/err
    wrapping).
- **typecheck-only + on-device:** all RN components, containers, screens, and the `_layout` modal
  wiring. No simulator in CI; verified on device.

## Out of scope (later features)

- Attachments (documents/photos on imaging & test entries) — Expo FileSystem + document picker +
  the `attachments` table and files-on-disk.
- A cross-region merged timeline / search.
- Moving an entry to a different region from the edit form (edit keeps the entry's region fixed).

## Note (next feature)

Attachments build directly on this: the edit/new imaging form gains a document picker, the
`attachments` repository (already in core) gets a mobile repository + provider, and files are written
under Expo `documentDirectory` per the data-model spec.
