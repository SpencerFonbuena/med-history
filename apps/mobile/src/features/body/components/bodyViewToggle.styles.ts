import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeBodyViewToggleStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.bgElement,
      borderRadius: theme.radius.md,
      padding: theme.spacing.xs,
      alignSelf: 'center',
    },
    segment: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.sm,
    },
    segmentSelected: {
      backgroundColor: theme.colors.bgSelected,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.footnote,
      fontWeight: '600',
    },
    labelSelected: {
      color: theme.colors.textPrimary,
    },
  });
