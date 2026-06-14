import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeEntryTypeTabsStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { gap: theme.spacing.xs, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
    tab: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.full, backgroundColor: theme.colors.bgElement },
    tabSelected: { backgroundColor: theme.colors.bgSelected },
    label: { color: theme.colors.textSecondary, fontSize: theme.text.footnote, fontWeight: '600' },
    labelSelected: { color: theme.colors.textPrimary },
  });
