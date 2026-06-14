import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeProfilesStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.bgApp,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    heading: {
      color: theme.colors.textPrimary,
      fontSize: theme.text.largeTitle,
      fontWeight: '700',
      marginBottom: theme.spacing.md,
    },
    separator: {
      height: theme.spacing.sm,
    },
    footer: {
      padding: theme.spacing.lg,
    },
    addButton: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
    },
    addButtonLabel: {
      color: theme.colors.textOnAccent,
      fontSize: theme.text.callout,
      fontWeight: '600',
    },
  });
