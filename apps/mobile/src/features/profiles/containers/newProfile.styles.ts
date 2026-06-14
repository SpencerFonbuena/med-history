import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeNewProfileStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.bgApp,
    },
    contentContainer: {
      padding: theme.spacing.lg,
    },
  });
