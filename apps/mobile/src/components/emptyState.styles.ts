import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeEmptyStateStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxl,
    },
    // Soft tinted disc behind the icon — gives the empty state a deliberate focal point.
    iconBadge: {
      width: 72,
      height: 72,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: theme.text.subtitle,
      fontWeight: '600',
      textAlign: 'center',
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.body,
      textAlign: 'center',
      lineHeight: theme.text.body * 1.4,
    },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent,
    },
    actionLabel: {
      color: theme.colors.textOnAccent,
      fontSize: theme.text.callout,
      fontWeight: '600',
    },
  });
