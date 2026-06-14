import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeAddProfileFormStyles = (theme: Theme) =>
  StyleSheet.create({
    form: {
      gap: theme.spacing.md,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.footnote,
      marginBottom: theme.spacing.xs,
    },
    field: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.bgApp,
    },
    fieldFocused: {
      borderColor: theme.colors.accent,
      borderWidth: 2,
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    fieldText: {
      color: theme.colors.textPrimary,
      fontSize: theme.text.body,
    },
    dobValueFilled: {
      color: theme.colors.textPrimary,
      fontSize: theme.text.body,
    },
    dobValuePlaceholder: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.body,
    },
    sexRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    option: {
      flex: 1,
      padding: theme.spacing.md,
      borderRadius: theme.radius.sm,
      borderWidth: 2,
      alignItems: 'center',
    },
    optionSelected: {
      borderColor: theme.colors.accent,
    },
    optionUnselected: {
      borderColor: theme.colors.border,
    },
    optionLabel: {
      color: theme.colors.textPrimary,
      fontSize: theme.text.body,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: theme.text.footnote,
    },
    submit: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitEnabled: {
      backgroundColor: theme.colors.accent,
      ...theme.shadow.sm,
    },
    submitDisabled: {
      backgroundColor: theme.colors.bgSelected,
    },
    submitting: {
      opacity: 0.6,
    },
    submitLabel: {
      color: theme.colors.textOnAccent,
      fontSize: theme.text.callout,
      fontWeight: '600',
    },
  });
