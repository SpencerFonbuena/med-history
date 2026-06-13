# Frontend Rules — Web & Mobile

Applies to both `apps/web` (Next.js) and `apps/mobile` (React Native/Expo).
The codebase is actively being refactored — ignore legacy code that violates these rules. Write all new code to this standard.

---

## Layer Map (read this first)

```
app/screen    →  container  →  hook  →  coordinator  →  api / repository
                     ↓                        ↓
                 component                 provider
                     ↓
                  context (Zustand)
```

- Data flows down. Concerns stay in their layer.
- React usage stops at hooks. Everything below (services, api, repositories, utils) must be framework-agnostic.
- Hooks may call providers directly for pure logic with no API access. Coordinators are only needed when `api/` or `repositories/` are involved.

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
  api/            # Internal backend calls
  components/     # Presentational UI
  containers/     # Coordination + composition
  context/        # Zustand stores
  hooks/          # React behavior layer
  repositories/   # External service calls
  schemas/        # Types, Zod schemas, enums
  services/
    coordinators/ # Orchestration: calls api/ and repositories/, handles errors
    providers/    # Pure logic functions. No React. Testable in isolation.
  utils/          # Pure helper functions
```

---

## 3. Layer Rules

### `api/` — Internal backend communication
- HTTP requests to our internal API only.
- Return raw or minimally parsed responses.
- No logic, no transformation, no error handling beyond request failure.
- No React.

### `repositories/` — External services
- Same rules as `api/`, but for third-party systems (Clerk, Supabase Storage, Stripe, etc.).
- Thin integration layer. No transformation or business logic.
- No React.

### `services/coordinators/` — Orchestration layer
- Calls `api/` and `repositories/`.
- Handles errors and returns typed `ApiResponse<T>` to callers.
- May compose multiple api/repository calls.
- Must not depend on React. Must be usable outside React.

### `services/providers/` — Pure logic
- Pure functions with no side effects.
- No API calls, no React, no store access.
- Encapsulate business rules, transformations, and routing decisions.
- Fully testable with a plain function call.

### `hooks/` — React behavior layer
- Bridge between React and the rest of the architecture.
- Used by containers. Expose React-friendly state and actions.
- May call services, api, repositories, context, and other hooks.
- Manage loading, error, and derived state.

**Hook rules:**
- One hook = one responsibility. Keep scope narrow.
- Must not return JSX.
- Must not contain styling logic.
- Must not contain raw API logic — that belongs in `api/`.
- Must not become dumping grounds for business logic — move it to `services/providers/`.
- Must not call `api/` or `repositories/` directly — go through `services/coordinators/`.
- If logic doesn't require React, it goes in `services/providers/` or `utils/`.
- Prefer composition over complexity. Expose clean, minimal interfaces.

### `containers/` — Coordination layer
- Call hooks to retrieve and manage data.
- Assemble and pass data into components.
- May contain minimal UI logic (e.g. conditional rendering).
- Must remain small. Split when growing.

**Container rules:**
- Must not call `api/` or `repositories/` directly.
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
- Shared across `api/`, `services/coordinators/`, `services/providers/`, and `hooks/`.
- No logic — definitions only.

### `utils/` — Pure helpers
- Small, pure functions.
- No side effects. No React. No business orchestration.

---

## 4. Styling

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

Asynchronous data fetching uses `@tanstack/react-query`. Every custom hook that loads data from `api/` or `repositories/` is built on top of react-query — do not hand-roll `useState` + `useEffect` fetch loops.

### Why react-query
- Caches queries across components and navigations with per-query staleTime.
- Dedupes in-flight requests automatically.
- `placeholderData: keepPreviousData` lets the UI keep showing old data during param-changing refetches, eliminating loading flashes on tab/selector switches.
- Centralized invalidation on writes: one `invalidateQueries({ queryKey: featureKeys.all })` call refreshes every cached query for a feature.

### Hook convention

Every data-fetching hook must:

1. Call a coordinator, not `api/` or `repositories/` directly.
2. Use `useQuery` (for reads) or `useMutation` (for writes).
3. Pull its query key from a centralized feature-level `queryKeys.ts` factory — never inline key arrays.
4. Set `staleTime` explicitly (default 60_000 for most read endpoints — do not rely on react-query's 0ms default which causes unnecessary refetches).
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
    staleTime: 60_000,
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

React-query does not change the layer boundaries. API DTO → UI shape mapping still happens in `services/providers/` as pure functions. The `queryFn` should: call the coordinator, which calls `api/`, parses with Zod, and maps via providers. Do not put transformation logic inline in `queryFn`.

### QueryProvider setup

Each app root wraps its tree in a `<QueryProvider>` component that owns a per-render `QueryClient` via `useState(() => new QueryClient(...))` — this is SSR-safe and prevents cross-request state leakage in Next.js App Router.

---

## Hard Rules (never violate)

- `app/` renders containers only — no logic, no imports from lower layers
- No store imports inside components
- No `api/` or `repository/` calls inside containers — go through hooks
- No `api/` or `repository/` calls inside hooks — go through coordinators
- No React in services, utils, api, or repositories
- No business logic in hooks — move it to services
- Stylesheets colocate with the file they style — one `.module.scss` per component or container
- No inline styles (`style={{ ... }}` in JSX)
- No hardcoded values in SCSS — use `@use` for static values, `var()` for theme-sensitive values
- Data-fetching hooks must use `@tanstack/react-query` (`useQuery` / `useMutation`) — never raw `useState`/`useEffect` fetch loops
- React-query keys must come from a feature-level `queryKeys.ts` factory — never inlined as raw arrays in hooks
