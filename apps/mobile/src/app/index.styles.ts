import { StyleSheet } from 'react-native';

import type { Theme } from '@/constants/theme';

export const makeHomeStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.bgApp,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: 22,
      fontWeight: '600',
    },
    subtitle: {
      color: theme.colors.textSecondary,
    },
  });
