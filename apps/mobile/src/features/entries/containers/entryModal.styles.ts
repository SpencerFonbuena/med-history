import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeEntryModalStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.bgApp },
    content: { padding: theme.spacing.lg, gap: theme.spacing.md },
    title: { color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '700' },
    subtitle: { color: theme.colors.textSecondary, fontSize: theme.text.footnote },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });
