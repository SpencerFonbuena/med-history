import { getTheme, type Theme } from '@/constants/theme';
import { useAppearance } from '@/features/settings/context/appearance.provider';

/** Resolved theme for the active appearance (persisted settings + any live preview). */
export function useTheme(): Theme {
  const { appearance } = useAppearance();
  return getTheme(appearance.scheme, appearance.sizeLevel);
}
