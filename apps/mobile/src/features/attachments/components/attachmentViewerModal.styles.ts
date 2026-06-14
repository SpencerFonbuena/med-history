import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeAttachmentViewerStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: '#000000' },
    image: { flex: 1 },
    close: {
      position: 'absolute',
      top: theme.spacing.xl,
      right: theme.spacing.lg,
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
