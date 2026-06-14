import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeIconButtonStyles = (theme: Theme) =>
  StyleSheet.create({
    // 44x44 guarantees an accessible touch target regardless of icon size.
    base: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.full,
    },
    surface: {
      backgroundColor: theme.colors.bgElement,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pressed: {
      opacity: 0.6,
    },
  });
