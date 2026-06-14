import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeBodyScreenStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.bgApp },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    headerText: { flex: 1 },
    name: { color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '700' },
    meta: { color: theme.colors.textSecondary, fontSize: theme.text.footnote },
    iconButton: { padding: theme.spacing.sm },
    iconGlyph: { color: theme.colors.textSecondary, fontSize: theme.text.title },
    backGlyph: { color: theme.colors.textPrimary, fontSize: theme.text.largeTitle },
    scroll: { alignItems: 'center', gap: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
    hint: { color: theme.colors.textSecondary, fontSize: theme.text.footnote, textAlign: 'center' },
    figureWrap: { alignItems: 'center', justifyContent: 'center' },
  });
