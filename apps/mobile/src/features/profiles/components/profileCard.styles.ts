import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeProfileCardStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.bgElement,
    },
    info: {
      flex: 1,
    },
    name: {
      color: theme.colors.textPrimary,
      fontSize: theme.text.callout,
      fontWeight: '600',
    },
    meta: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.footnote,
    },
    chevron: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.title,
    },
  });
