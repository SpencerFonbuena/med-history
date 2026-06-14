import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeAttachmentsGridStyles = (theme: Theme) =>
  StyleSheet.create({
    label: { color: theme.colors.textSecondary, fontSize: theme.text.footnote, marginBottom: theme.spacing.xs },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    addTile: {
      width: 96,
      height: 96,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.bgApp,
    },
    addLabel: { color: theme.colors.textSecondary, fontSize: theme.text.caption },
  });
