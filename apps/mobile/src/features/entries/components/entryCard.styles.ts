import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeEntryCardStyles = (theme: Theme) =>
  StyleSheet.create({
    // Bordered card on the app background, matching the mock's .entry card.
    card: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.bgElement,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.xs,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.sm },
    title: { flex: 1, color: theme.colors.textPrimary, fontSize: theme.text.callout, fontWeight: '600' },
    date: { color: theme.colors.textSecondary, fontSize: theme.text.footnote },
    // Body is dimmed (mock uses text-dim) with comfortable line height.
    body: { color: theme.colors.textSecondary, fontSize: theme.text.body, lineHeight: 22 },
    // Meta sits below a hairline divider (mock: dashed border-top), label brighter than value.
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      marginTop: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderSubtle,
    },
    meta: { color: theme.colors.textSecondary, fontSize: theme.text.footnote },
    metaLabel: { color: theme.colors.textPrimary, fontWeight: '600' },
  });
