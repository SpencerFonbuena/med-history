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
    },
    field: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
      padding: theme.spacing.sm,
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
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      alignItems: 'center',
    },
    submitEnabled: {
      backgroundColor: theme.colors.accent,
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
