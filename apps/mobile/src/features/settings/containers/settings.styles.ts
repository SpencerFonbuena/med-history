import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeSettingsStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.bgApp },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    title: { color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '700' },
    content: { padding: theme.spacing.lg, gap: theme.spacing.lg },

    // Each setting group is a bordered card with a heading and supporting copy.
    section: {
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.bgElement,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionHeader: { gap: 2 },
    sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.text.subtitle, fontWeight: '600' },
    sectionHint: { color: theme.colors.textSecondary, fontSize: theme.text.footnote, lineHeight: 20 },

    preview: { alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm },
    previewText: { color: theme.colors.textPrimary, fontSize: theme.text.body },
  });
