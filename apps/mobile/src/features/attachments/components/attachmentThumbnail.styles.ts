import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeAttachmentThumbnailStyles = (theme: Theme) =>
  StyleSheet.create({
    tile: {
      width: 96,
      height: 96,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      backgroundColor: theme.colors.bgElement,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    image: { width: '100%', height: '100%' },
    doc: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs, padding: theme.spacing.xs },
    docName: { color: theme.colors.textSecondary, fontSize: theme.text.caption, textAlign: 'center' },
    remove: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 22,
      height: 22,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.bgApp,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });
