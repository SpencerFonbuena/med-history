import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeRegionEntriesStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.bgApp },
    // Negative left margin offsets the IconButton's internal padding so its glyph
    // optically aligns with the screen's content edge.
    header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
    title: { color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '700' },
    listWrap: { flex: 1 },
    fab: {
      position: 'absolute', right: theme.spacing.lg, bottom: theme.spacing.xl,
      width: 56, height: 56, borderRadius: theme.radius.full,
      alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent,
      ...theme.shadow.md,
    },
  });
