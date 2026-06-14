import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeRegionPlaceholderStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.bgApp },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    backGlyph: { color: theme.colors.textPrimary, fontSize: theme.text.largeTitle },
    title: { color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '700' },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.lg,
    },
    bodyText: { color: theme.colors.textSecondary, fontSize: theme.text.body, textAlign: 'center' },
  });
