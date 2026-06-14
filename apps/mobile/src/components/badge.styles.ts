import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeBadgeStyles = (theme: Theme) =>
  StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: theme.spacing.xs,
      paddingVertical: 3,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
    },
    label: {
      color: theme.colors.accent,
      fontSize: theme.text.caption,
      fontWeight: '600',
    },
  });
