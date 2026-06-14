import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeProfileSettingsStyles = (theme: Theme) =>
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
    content: { flex: 1, padding: theme.spacing.lg, gap: theme.spacing.xs },
    name: { color: theme.colors.textPrimary, fontSize: theme.text.largeTitle, fontWeight: '700' },
    meta: { color: theme.colors.textSecondary, fontSize: theme.text.body },
    footer: { padding: theme.spacing.lg },
    deleteButton: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.danger,
    },
    deleteLabel: { color: theme.colors.danger, fontSize: theme.text.callout, fontWeight: '600' },
  });
