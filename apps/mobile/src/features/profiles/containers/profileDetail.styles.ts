import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeProfileDetailStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.bgApp,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    name: {
      color: theme.colors.textPrimary,
      fontSize: theme.text.largeTitle,
      fontWeight: '700',
    },
    meta: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.body,
    },
    bodyPlaceholder: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.body,
      marginTop: theme.spacing.lg,
    },
    footer: {
      padding: theme.spacing.lg,
    },
    deleteButton: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.danger,
    },
    deleteLabel: {
      color: theme.colors.danger,
      fontSize: theme.text.callout,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
