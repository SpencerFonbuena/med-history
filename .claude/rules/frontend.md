# Frontend Rules — Mobile (local-first)

Applies to `apps/mobile` (React Native/Expo). There is no web app and **no backend** —
MedHistory is local-first: all data lives on-device in SQLite, with no internal API to call.
The codebase is actively being refactored — ignore legacy code that violates these rules. Write all new code to this standard.

> **Where the data layer lives.** The low-level data engine — SQLite schema, migrations,
> query primitives, domain models, and pure data business logic — lives in **`packages/core`**
> (framework-agnostic, Node-testable). Feature `repositories/` are thin wrappers in
> `apps/mobile` that call `core` for that feature's tables. Domain rules live in `core`;
> presentation logic lives in the feature. See `repositories/` below.

---

## Layer Map (read this first)

```
app/screen    →  container  →  hook  →  coordinator  →  repository  →  packages/core
                     ↓                        ↓
                 component                 provider
                     ↓
                  context (Zustand)
```

- Data flows down. Concerns stay in their layer.
- React usage stops at hooks. Everything below (services, repositories, utils) must be framework-agnostic.
- Hooks may call providers directly for pure logic with no data access. Coordinators are only needed when `repositories/` are involved. Many coordinators will be thin (a single local read) — that is fine; they earn their keep when composing multiple writes or handling errors across reads.

---

## 1. App / Screen Layer (routing only)

`src/app/` (web) and `src/app/` (mobile/Expo Router) are **routing only**.

- Render one container. Nothing else.
- No business logic, data fetching, or state management.
- No imports of services, hooks, or api.
- No JSX beyond delegating to a container.

```tsx
// src/app/dashboard/page.tsx
import { DashboardContainer } from '@/features/dashboard/containers/dashboard.container';
export default function DashboardPage() {
  return <DashboardContainer />;
}
```

---

## 2. Feature Structure

All application code lives in `src/features/{featureName}/`. Features are self-contained and independent.

- Cross-feature imports should be minimized and intentional.
- Each feature owns its own data, logic, and UI.

**Allowed folders — no others:**

```
src/features/{feature}/
  components/     # Presentational UI
  containers/     # Coordination + composition
  context/        # Zustand stores
  hooks/          # React behavior layer
  repositories/   # Local/device data sources — SQLite (via packages/core), FileSystem, SecureStore, StoreKit
  schemas/        # Types, Zod schemas, enums
  services/
    coordinators/ # Orchestration: calls repositories/, handles errors
    providers/    # Pure logic functions. No React. Testable in isolation.
  utils/          # Pure helper functions
```

> There is no `api/` folder. It existed for internal backend HTTP calls — this app has no
> backend, so the layer is removed. All data access goes through `repositories/`.

---

## 3. Layer Rules

### `repositories/` — Local & device data sources
- The data layer. Talks to on-device sources: **SQLite (via `packages/core`)**, the file
  system (Expo FileSystem — attachments, import/export files), SecureStore, and the billing
  store (StoreKit / IAP).
- Thin integration layer. No transformation or business logic — that lives in `packages/core`
  (data domain rules) or `services/providers/` (UI shaping).
- A SQLite-backed repository is a thin wrapper over a `core` data function for one feature's
  tables; it does not write SQL inline. Device-API repositories (FileSystem, SecureStore,
  StoreKit) wrap the native call and return the response, per `mobile.md §5`.
- No React.

### `services/coordinators/` — Orchestration layer
- Calls `repositories/`.
- Handles errors and returns a typed `Result<T>` to callers. (There is no API; do not call this `ApiResponse`.)
- May compose multiple repository calls (e.g. create a record and update an index in one flow).
- Must not depend on React. Must be usable outside React.

### `services/providers/` — Pure logic
- Pure functions with no side effects.
- No API calls, no React, no store access.
- Encapsulate business rules, transformations, and routing decisions.
- Fully testable with a plain function call.

### `hooks/` — React behavior layer
- Bridge between React and the rest of the architecture.
- Used by containers. Expose React-friendly state and actions.
- May call services, repositories, context, and other hooks.
- Manage loading, error, and derived state.

**Hook rules:**
- One hook = one responsibility. Keep scope narrow.
- Must not return JSX.
- Must not contain styling logic.
- Must not contain raw data-access logic — that belongs in `repositories/` (and `packages/core`).
- Must not become dumping grounds for business logic — move it to `services/providers/`.
- Must not call `repositories/` directly — go through `services/coordinators/`.
- If logic doesn't require React, it goes in `services/providers/` or `utils/`.
- Prefer composition over complexity. Expose clean, minimal interfaces.

### `containers/` — Coordination layer
- Call hooks to retrieve and manage data.
- Assemble and pass data into components.
- May contain minimal UI logic (e.g. conditional rendering).
- Must remain small. Split when growing.

**Container rules:**
- Must not call `repositories/` directly.
- Must not contain business logic.
- Orchestrators, not processors.

### `components/` — Presentation layer
- Receive all data via props. Render UI only.
- Reusable and composable within the feature.

**Component rules:**
- No data fetching.
- No backend awareness.
- No business logic.
- `useState` allowed for visual/presentational state only (e.g. toggle, open/close).

### `context/` — Shared state (Zustand)
- Used for cross-component or cross-container state within a feature.
- Must not replace server state or API-driven data.
- Keep minimal and intentional.
- No API calls inside stores — stores hold state only.

### `schemas/` — Data contracts
- Zod schemas, TypeScript types, and enums.
- Defines expected shapes of data.
- Shared across `repositories/`, `services/coordinators/`, `services/providers/`, and `hooks/`.
- Especially important for validating untrusted input: the bundled medication JSON and user-supplied import/export files must be parsed through Zod.
- No logic — definitions only.

### `utils/` — Pure helpers
- Small, pure functions.
- No side effects. No React. No business orchestration.

---

## 4. Styling

> **Superseded for this project.** This SCSS (`@use` / `var()`) system is the web convention.
> Mobile has no SCSS — styling here follows `mobile.md §4` (`.styles.ts` + `makeStyles(theme)`
> off `src/constants/theme.ts`). The section below is retained for reference only; do not apply it.

- Stylesheets are colocated with the file they style — one `.module.scss` per component or container.
- **No inline styles** (`style={{ ... }}` in JSX) anywhere.
- **No hardcoded values** in SCSS modules — no hex colors, no raw px for spacing/radius/z-index, no raw breakpoint numbers.
- All values come from the constants system via one of two mechanisms:

**`@use` for static (compile-time) values** — dimensions, spacing, radius, z-index, breakpoint mixins:

```scss
@use 'constants/layout' as layout;
@use 'constants/breakpoints' as bp;

.sidebar {
  width: layout.$sidebar-width;
  z-index: layout.$z-sticky;
  padding: layout.$space-md layout.$space-lg;
  border-radius: layout.$radius-md;

  @include bp.tablet { ... }
}
```

**`var()` for theme-sensitive (runtime) values** — all colors, backgrounds, borders, text:

```scss
.sidebar {
  background: var(--bg-app-alt);
  border-right: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}
```

Theme tokens switch at runtime when `data-theme` changes; SCSS variables cannot. Use `@use` for everything static, `var()` for everything that must respond to the active theme.
If a needed token does not exist in the constants files, add it to the appropriate file under `src/constants/` rather than hardcoding the value inline. **Exception:** `font-size`, `letter-spacing`, and `line-height` values may be hardcoded until a `_typography.scss` constants file is defined — these are not yet covered by the constants system.

---

## 5. Naming

- Files and folders use `camelCase` for multi-word names: `swingCard.component.tsx`, `useSwingUpload.hook.ts`
- The exported name must match the file name exactly.
- Names must clearly reflect the responsibility of the file.
- All files **must** follow the `name.type.ext` pattern — no exceptions.

| Type | Suffix | Example |
|---|---|---|
| Component | `{name}.component.tsx` | `navItem.component.tsx` |
| Container | `{name}.container.tsx` | `sidebar.container.tsx` |
| Hook | `{name}.hook.ts` | `useTheme.hook.ts` |
| Store | `{name}.store.ts` | `theme.store.ts` |
| Schema | `{name}.schema.ts` | `nav.schema.ts` |
| API | `{name}.api.ts` | `dashboard.api.ts` |
| Repository | `{name}.repository.ts` | `dashboard.repository.ts` |
| Coordinator | `{name}.coordinator.ts` | `gateway.coordinator.ts` |
| Provider | `{name}.provider.ts` | `accessRouter.provider.ts` |

---

## 6. Data Fetching

Asynchronous data access uses `@tanstack/react-query`. Every custom hook that reads data from `repositories/` is built on top of react-query — do not hand-roll `useState` + `useEffect` loops. react-query is not network-specific; here the `queryFn` reads on-device SQLite (via a coordinator) instead of hitting a server, and its mutation→invalidation model is what keeps screens in sync after a local write.

### Why react-query (local-first)
- Caches query results across components and navigations.
- Centralized invalidation on writes: one `invalidateQueries({ queryKey: featureKeys.all })` after a mutation refreshes every cached query for a feature. **This — not time — is how local data refreshes:** the on-device DB is the only source of truth, so a query is never "stale" until *we* change the data.
- `placeholderData: keepPreviousData` keeps the UI from flashing when a filter/selector changes the query params.

### Local-first defaults (differ from a networked app)
- **`staleTime: Infinity`** on reads. There is no server that can change data behind your back; the only way data changes is a local mutation, which you handle with explicit `invalidateQueries`. Do not use a time-based `staleTime` — it would just cause pointless re-reads of SQLite.
- **`placeholderData: keepPreviousData`** only when query params can change at runtime (filters, selectors, paginated lists). Not required for static reads.

### Hook convention

Every data hook must:

1. Call a coordinator, not `repositories/` directly.
2. Use `useQuery` (for reads) or `useMutation` (for writes).
3. Pull its query key from a centralized feature-level `queryKeys.ts` factory — never inline key arrays.
4. Set `staleTime: Infinity` (local data is authoritative — refresh via mutation invalidation, not time).
5. Set `placeholderData: keepPreviousData` when query params can change at runtime (selectors, filters, paginated lists).
6. Return a `{ data, loading, error, refetch }` object. Prefer feature-specific names for `data` (e.g. `summary`, `events`, `history`) so containers read naturally.
7. Throw from `queryFn` on coordinator failure — react-query's `isError` branch only triggers on thrown errors.

Example:
```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchFooBar } from '@/features/foo/services/coordinators/foo.coordinator';
import { fooKeys } from '@/features/foo/queryKeys';

export function useFooBar(fooId: string) {
  const query = useQuery({
    queryKey: fooKeys.bar(fooId),
    queryFn: async () => {
      const result = await fetchFooBar(fooId);
      if (!result.success) throw new Error(result.userMessage ?? 'Failed to load.');
      return result.data;
    },
    enabled: fooId.length > 0,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.isError ? (query.error as Error).message : null,
    refetch: () => { void query.refetch(); },
  };
}
```

### Query key factory

Every feature that uses react-query owns a `queryKeys.ts` at its root with a hierarchical factory:

```typescript
export const fooKeys = {
  all: ['foo'] as const,
  bar: (id: string) => [...fooKeys.all, 'bar', id] as const,
  list: (range: { from?: string; to?: string }) =>
    [...fooKeys.all, 'list', range] as const,
};
```

This lets a single `invalidateQueries({ queryKey: fooKeys.all })` clear every cached foo query after a mutation.

### Transformation still belongs in providers

React-query does not change the layer boundaries. DB row → UI shape mapping still happens in `services/providers/` as pure functions. The `queryFn` should: call the coordinator, which calls a repository (which calls `packages/core`), validates with Zod, and maps via providers. Do not put transformation logic inline in `queryFn`.

### QueryProvider setup

The app root wraps its tree in a single `<QueryProvider>` that owns one app-lifetime `QueryClient`. Create it once in module scope (or a `useState(() => new QueryClient(...))` at the root) — there is no SSR/per-request concern on mobile, so a single long-lived client is correct.

---

## Hard Rules (never violate)

- There is no `api/` layer — all data access goes through `repositories/` → `packages/core`
- `app/` renders containers only — no logic, no imports from lower layers
- No store imports inside components
- No `repository/` calls inside containers — go through hooks
- No `repository/` calls inside hooks — go through coordinators
- No React in services, utils, or repositories
- No business logic in hooks — move it to services (UI shaping) or `packages/core` (domain rules)
- Styling is governed by `mobile.md §4` (`.styles.ts` + `makeStyles(theme)`) — the SCSS rules in §4 below do not apply to this project
- Data hooks must use `@tanstack/react-query` (`useQuery` / `useMutation`) — never raw `useState`/`useEffect` loops
- React-query reads use `staleTime: Infinity` and refresh via mutation `invalidateQueries`, never time-based staleness
- React-query keys must come from a feature-level `queryKeys.ts` factory — never inlined as raw arrays in hooks
