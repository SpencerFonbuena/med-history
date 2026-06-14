import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeEntryListStyles = (theme: Theme) =>
  StyleSheet.create({
    // Extra bottom padding so the floating FAB never covers the last card.
    list: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl * 2, gap: theme.spacing.sm },
    sep: { height: theme.spacing.sm },
  });
