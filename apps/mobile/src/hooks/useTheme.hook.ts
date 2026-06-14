import { getTheme, type Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme.hook';

/**
 * The resolved theme for the active color scheme. Pass the result into a
 * `makeStyles(theme)` factory inside a component (see mobile.md §4).
 */
export function useTheme(): Theme {
  return getTheme(useColorScheme());
}
