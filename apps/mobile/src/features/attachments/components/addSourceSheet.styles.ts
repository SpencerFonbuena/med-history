import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeAddSourceSheetStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
      backgroundColor: theme.colors.bgApp,
      borderTopLeftRadius: theme.radius.lg,
      borderTopRightRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    title: { color: theme.colors.textPrimary, fontSize: theme.text.subtitle, fontWeight: '600', marginBottom: theme.spacing.sm },
    option: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.md },
    optionLabel: { color: theme.colors.textPrimary, fontSize: theme.text.callout },
    cancel: { marginTop: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center', backgroundColor: theme.colors.bgElement },
    cancelLabel: { color: theme.colors.textPrimary, fontSize: theme.text.callout, fontWeight: '600' },
  });
