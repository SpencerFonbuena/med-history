import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeEntryFormStyles = (theme: Theme) =>
  StyleSheet.create({
    form: { gap: theme.spacing.md },
    fieldLabel: { color: theme.colors.textSecondary, fontSize: theme.text.footnote, marginBottom: theme.spacing.xs },
    field: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.sm, backgroundColor: theme.colors.bgApp },
    // Accent ring on the focused field, so the active input is unmistakable.
    fieldFocused: { borderColor: theme.colors.accent, borderWidth: 2 },
    // For tappable fields that show a value plus a trailing icon (date, medication).
    fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    fieldText: { color: theme.colors.textPrimary, fontSize: theme.text.body },
    bodyInput: { minHeight: 96, textAlignVertical: 'top' },
    dateValue: { color: theme.colors.textPrimary, fontSize: theme.text.body },
    toggleRow: { flexDirection: 'row', gap: theme.spacing.sm },
    toggleOption: { flex: 1, padding: theme.spacing.md, borderRadius: theme.radius.sm, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center' },
    toggleOptionSelected: { borderColor: theme.colors.accent },
    toggleLabel: { color: theme.colors.textPrimary, fontSize: theme.text.body },
    error: { color: theme.colors.danger, fontSize: theme.text.footnote },
    save: { flexDirection: 'row', gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent, ...theme.shadow.sm },
    saveDisabled: { backgroundColor: theme.colors.bgSelected, shadowOpacity: 0, elevation: 0 },
    saveLabel: { color: theme.colors.textOnAccent, fontSize: theme.text.callout, fontWeight: '600' },
    delete: { flexDirection: 'row', gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.danger },
    deleteLabel: { color: theme.colors.danger, fontSize: theme.text.callout, fontWeight: '600' },
    medField: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.sm, backgroundColor: theme.colors.bgApp },
    medValue: { fontSize: theme.text.body },
  });
