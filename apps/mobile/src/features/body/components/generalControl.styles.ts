import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeGeneralControlStyles = (theme: Theme) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      alignSelf: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.bgElement,
    },
    pillLit: {
      borderColor: theme.colors.accent,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.dotDim,
    },
    indicatorLit: {
      backgroundColor: theme.colors.accent,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.footnote,
      fontWeight: '600',
    },
    labelLit: {
      color: theme.colors.textPrimary,
    },
  });
