import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeEntryCardStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.bgElement,
      gap: theme.spacing.xs,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.sm },
    title: { flex: 1, color: theme.colors.textPrimary, fontSize: theme.text.callout, fontWeight: '600' },
    date: { color: theme.colors.textSecondary, fontSize: theme.text.footnote },
    body: { color: theme.colors.textPrimary, fontSize: theme.text.body },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginTop: theme.spacing.xs },
    meta: { color: theme.colors.textSecondary, fontSize: theme.text.footnote },
    metaLabel: { color: theme.colors.textSecondary, fontWeight: '700' },
  });
