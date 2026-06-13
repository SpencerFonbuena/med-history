# Mobile Rules — apps/mobile (React Native / Expo)

The mobile codebase is mid-refactor. Large parts of it still reflect the old Appwrite-era architecture and conventions. **Ignore all of it.** Do not replicate patterns you see in existing mobile files. Do not treat current conventions as a reference. Write all new code to the rules below.

---

## 1. Defer to Frontend Rules

All rules in `frontend.md` apply to mobile unless explicitly overridden in this document. That includes:

- Layer map: `app/screen → container → hook → coordinator → api/repository`
- Feature folder structure and allowed subfolders
- Layer responsibilities (api, repositories, services/coordinators, services/providers, hooks, containers, components, context, schemas, utils)
- File naming (`name.type.ext`)
- Data fetching with `@tanstack/react-query` and centralized query key factories
- Hard rules around store access, logic placement, and layer boundaries

If something in this document conflicts with `frontend.md`, this document wins — but only for mobile.

---

## 2. Never Touch Native Folders

Do not write, edit, or create files inside `android/` or `ios/` unless the user **explicitly** instructs you to. These folders contain native Kotlin/Swift code and build configuration. Treat them as read-only by default.

If a task seems to require native changes, stop and ask first.

---

## 3. Features vs Portals

The web app taught us that "feature" gets overloaded to mean three different things: a domain capability, a persona experience, and a screen. Mobile splits these explicitly into two folders.

### Feature = owns data

`src/features/{feature}/` holds a coherent data domain. A feature must pass this test:

> **What data does this feature own?** — answerable in one sentence.

Examples: `calendar` owns calendar events. `swings` owns swing records. `messages` owns conversations. `profile` owns the user's profile.

Features are persona-agnostic. They do not know whether a coach or a player is using them. Features follow the exact structure defined in `frontend.md`.

### Portal = composes features for a persona

`src/portals/{portal}/` holds a persona-specific shell. A portal composes multiple features into a cohesive experience for one kind of user. Examples: `coach`, `player`.

Portals own **zero data**. They are pure composition.

**Allowed folders in a portal — no others:**

```
src/portals/{portal}/
  containers/    # Persona-specific compositions. Pull from multiple features' hooks.
  components/    # Persona-specific UI (custom tab bar, persona header, etc.)
  hooks/         # Thin — persona-local UI state only. No data fetching.
  utils/         # Pure helpers.
```

**Explicitly not allowed in portals:** `api/`, `repositories/`, `schemas/`, `services/`, `context/`. If a portal needs any of these, the logic belongs in a feature. Move it there and import it.

### Screens only render containers

`src/app/` is Expo Router. Screens render **one** container — either a portal container (for persona-specific views) or a feature container (for shared views). Nothing else.

```tsx
// src/app/(coach)/dashboard.tsx
import { CoachDashboardContainer } from '@/portals/coach/containers/coachDashboard.container';
export default function CoachDashboardScreen() {
  return <CoachDashboardContainer />;
}
```

Tab layouts and navigation shells live in `_layout.tsx` files inside `src/app/`. Keep them thin — they are routing, not logic.

### The Decision Rule

When adding new code, ask:

- Does this own data? → `features/`
- Does this compose features for a specific persona? → `portals/`
- Is this a route? → `src/app/`

If you can't answer "what data does this own?" in one sentence, it is not a feature.

---

## 4. Styling

React Native has no SCSS, so the web app's `@use` / `var()` system does not apply. The principle is the same — no hardcoded values, all tokens — but the mechanism is different.

### Separate style files

Styles live in their own file, colocated with the component or container they style. One `.styles.ts` per component or container, same pattern as the web app's `.module.scss` files.

### Factory pattern for theme-aware styles

`StyleSheet.create` is static and cannot respond to theme changes at runtime. Use a `makeStyles(theme)` factory instead, consumed via a `useTheme` hook inside the component.

```ts
// button.styles.ts
import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeButtonStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.bgAppAlt,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    label: {
      color: theme.colors.textPrimary,
    },
  });
```

```tsx
// button.component.tsx
import { Pressable, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { makeButtonStyles } from './button.styles';

export function Button({ label }: ButtonProps) {
  const theme = useTheme();
  const styles = makeButtonStyles(theme);
  return (
    <Pressable style={styles.container}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
```

### Style rules

- One `.styles.ts` per component or container.
- No inline `style={{ ... }}` props in JSX — except for truly dynamic values that cannot live in a `StyleSheet` (e.g. an animated width driven by shared values).
- No hardcoded colors, spacing, radius, or z-index. All values come from `src/constants/theme.ts`.
- If a needed token does not exist in the constants file, **add it to the constants file** rather than hardcoding the value inline.
- Font size, letter spacing, and line height values may be hardcoded until a typography constants module is defined.

---

## 5. Device APIs Live in Repositories

Anything that talks to the device or OS is an external service and belongs in `repositories/`, not in hooks, providers, or components. This includes:

- Camera and image picker
- Location and geolocation
- Secure storage (tokens, credentials)
- Notifications (push and local)
- File system access
- Haptics, biometrics, sensors

Treat these the same way web treats Stripe or Clerk — thin wrappers that call the external API and return the response. No logic, no transformation. This keeps hooks and providers framework-agnostic and testable.

```ts
// cameraRepository.ts
import * as ImagePicker from 'expo-image-picker';

export async function pickVideoFromLibrary() {
  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    quality: 1,
  });
}
```

---

## 6. Sensitive Data Uses SecureStore

All sensitive values — auth tokens, refresh tokens, API keys, anything that should not leak — go through a `secureStorage.repository.ts` backed by Expo SecureStore. Never use `AsyncStorage` for sensitive data. `AsyncStorage` is fine for non-sensitive preferences and caches only.

---

## 7. Platform-Specific Code is a Last Resort

Prefer `Platform.select({ ios: ..., android: ... })` inside one file over creating `.ios.tsx` / `.android.tsx` splits. Only create split files when the divergence is large enough that keeping both platforms in one file becomes unreadable.

Never put business logic in platform-specific files. Platform splits are for presentation and platform APIs only.

---

## 8. Installing Dependencies

All mobile dependencies must be installed via `npx expo install <package>` — never `npm install <package>` directly. `npx expo install` resolves the version compatible with the current Expo SDK, preventing version mismatches that cause build failures.

This applies to all packages: Expo modules, third-party React Native libraries, and JS-only packages alike.

---

## Hard Rules (never violate)

- Install packages with `npx expo install` — never raw `npm install`
- Ignore existing mobile code patterns — legacy code does not define the standard
- Never edit `android/` or `ios/` without explicit instruction
- A feature must own data; if it doesn't, it belongs in `portals/`
- Portals may not contain `api/`, `repositories/`, `schemas/`, `services/`, or `context/`
- Screens in `src/app/` render one container and nothing else
- Styles live in a separate `.styles.ts` file colocated with the component
- No inline `style={{ ... }}` props except for truly dynamic values
- No hardcoded colors, spacing, radius, or z-index — use `src/constants/theme.ts`
- All device/OS APIs live in `repositories/`
- Sensitive data goes through SecureStore, never AsyncStorage
- Prefer `Platform.select` over `.ios.tsx` / `.android.tsx` file splits
