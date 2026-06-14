import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeBodyScreenStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.bgApp },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    headerText: { flex: 1 },
    name: { color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '700' },
    meta: { color: theme.colors.textSecondary, fontSize: theme.text.footnote },
    scroll: { alignItems: 'center', gap: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
    hint: { color: theme.colors.textSecondary, fontSize: theme.text.footnote, textAlign: 'center' },
    figureWrap: { alignItems: 'center', justifyContent: 'center' },
  });
