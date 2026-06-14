import { useColorScheme as useRNColorScheme } from 'react-native';

import type { ColorScheme } from '@/constants/theme';

/**
 * The active OS color scheme, normalized so callers never have to handle `null`.
 * Defaults to `dark` to match MedHistory's default look.
 */
export function useColorScheme(): ColorScheme {
  return useRNColorScheme() === 'light' ? 'light' : 'dark';
}
