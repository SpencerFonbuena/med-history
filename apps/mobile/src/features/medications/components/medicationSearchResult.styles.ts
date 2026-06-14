import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeMedicationSearchResultStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.borderSubtle },
    name: { color: theme.colors.textPrimary, fontSize: theme.text.body },
  });
