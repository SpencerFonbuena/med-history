import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeEntryCardStyles = (theme: Theme) =>
  StyleSheet.create({
    // Elevated card with a colored left edge that encodes the entry type.
    card: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      paddingLeft: theme.spacing.md - 3, // compensate for the 3px accent edge
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.bgElement,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderLeftWidth: 3, // color set per-type inline
      ...theme.shadow.sm,
    },
    pressed: { opacity: 0.7 },

    headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
    // Circular tinted badge for the type icon, color set per-type inline.
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: { flex: 1, gap: 1 },
    // Small uppercase category label; color set per-type inline.
    type: { fontSize: theme.text.caption, fontWeight: '700', letterSpacing: 0.6 },
    title: { color: theme.colors.textPrimary, fontSize: theme.text.callout, fontWeight: '600' },
    date: { color: theme.colors.textSecondary, fontSize: theme.text.footnote, paddingTop: 1 },

    body: { color: theme.colors.textSecondary, fontSize: theme.text.body, lineHeight: theme.text.body * 1.4 },

    // Type-specific fields as a labeled grid — a small uppercase label over its
    // value, flowing into one or two columns. Reads like a structured record.
    metaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.xs,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderSubtle,
      rowGap: theme.spacing.sm,
      columnGap: theme.spacing.lg,
    },
    metaItem: { flexGrow: 1, flexBasis: '40%' },
    metaLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.text.caption,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    metaValue: { color: theme.colors.textPrimary, fontSize: theme.text.footnote },
  });
