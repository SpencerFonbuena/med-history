import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeMedicationSearchModalStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.bgApp },
    header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
    cancel: { color: theme.colors.accent, fontSize: theme.text.body },
    input: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.sm, color: theme.colors.textPrimary, fontSize: theme.text.body },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm },
    hint: { color: theme.colors.textSecondary, fontSize: theme.text.footnote },
    freeText: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.borderSubtle },
    freeTextLabel: { color: theme.colors.accent, fontSize: theme.text.body, fontWeight: '600' },
  });
