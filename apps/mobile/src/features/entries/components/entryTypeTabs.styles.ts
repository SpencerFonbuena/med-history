import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeEntryTypeTabsStyles = (theme: Theme) =>
  StyleSheet.create({
    // flexGrow:0 keeps the horizontal strip at its content height — in a flex column it
    // would otherwise stretch and turn the tabs into tall ovals. The bottom border is the
    // divider the active tab's underline sits on (mock: nav.tabs border-bottom).
    scroll: {
      flexGrow: 0,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    // alignItems:center stops the tabs from stretching to the strip height.
    row: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    tab: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabSelected: {
      borderBottomColor: theme.colors.accent,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.footnote,
      fontWeight: '600',
    },
    labelSelected: {
      color: theme.colors.accent,
    },
  });
