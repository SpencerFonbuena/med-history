import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeEntryListStyles = (theme: Theme) =>
  StyleSheet.create({
    // Extra bottom padding so the floating FAB never covers the last card.
    list: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl * 2, gap: theme.spacing.sm },
    sep: { height: theme.spacing.sm },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, padding: theme.spacing.xxl },
    emptyIcon: { fontSize: 40 },
    emptyText: { color: theme.colors.textSecondary, fontSize: theme.text.body, textAlign: 'center' },
  });
