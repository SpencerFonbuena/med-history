import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeEntryFormStyles = (theme: Theme) =>
  StyleSheet.create({
    form: { gap: theme.spacing.md },
    fieldLabel: { color: theme.colors.textSecondary, fontSize: theme.text.footnote },
    field: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.sm },
    fieldText: { color: theme.colors.textPrimary, fontSize: theme.text.body },
    bodyInput: { minHeight: 96, textAlignVertical: 'top' },
    dateValue: { color: theme.colors.textPrimary, fontSize: theme.text.body },
    toggleRow: { flexDirection: 'row', gap: theme.spacing.sm },
    toggleOption: { flex: 1, padding: theme.spacing.md, borderRadius: theme.radius.sm, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center' },
    toggleOptionSelected: { borderColor: theme.colors.accent },
    toggleLabel: { color: theme.colors.textPrimary, fontSize: theme.text.body },
    error: { color: theme.colors.danger, fontSize: theme.text.footnote },
    save: { padding: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center', backgroundColor: theme.colors.accent },
    saveDisabled: { backgroundColor: theme.colors.bgSelected },
    saveLabel: { color: theme.colors.textOnAccent, fontSize: theme.text.callout, fontWeight: '600' },
    delete: { padding: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.danger },
    deleteLabel: { color: theme.colors.danger, fontSize: theme.text.callout, fontWeight: '600' },
  });
