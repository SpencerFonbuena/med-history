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
    headingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    heading: {
      color: theme.colors.textPrimary,
      fontSize: theme.text.largeTitle,
      fontWeight: '700',
    },
    separator: {
      height: theme.spacing.sm,
    },
    footer: {
      padding: theme.spacing.lg,
    },
    addButton: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadow.sm,
    },
    addButtonLabel: {
      color: theme.colors.textOnAccent,
      fontSize: theme.text.callout,
      fontWeight: '600',
    },
  });
