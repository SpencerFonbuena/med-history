import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeRegionEntriesStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.bgApp },
    header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
    backGlyph: { color: theme.colors.textPrimary, fontSize: theme.text.largeTitle },
    title: { color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '700' },
    listWrap: { flex: 1 },
    fab: {
      position: 'absolute', right: theme.spacing.lg, bottom: theme.spacing.xl,
      width: 56, height: 56, borderRadius: theme.radius.full,
      alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent,
    },
    fabGlyph: { color: theme.colors.textOnAccent, fontSize: theme.text.largeTitle, fontWeight: '700' },
  });
