import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeProfilesEmptyStateStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xxl,
    },
    emoji: {
      fontSize: 40,
    },
    heading: {
      color: theme.colors.textPrimary,
      fontSize: theme.text.subtitle,
      fontWeight: '600',
    },
    body: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.body,
      textAlign: 'center',
    },
  });
