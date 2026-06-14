/**
 * Design tokens for the app. Consumed via the `useTheme` hook and `makeStyles(theme)`
 * factories (see mobile.md §4). Never hardcode colors/spacing/radius in a component —
 * add a token here instead.
 *
 * Colors are theme-sensitive (light/dark). Spacing and radius are static.
 */

import { Platform } from 'react-native';
import { scaleType, type TypeScale } from './typography';
import { figureScale as figureScaleFor, type SizeLevel } from './appearance';

const palette = {
  light: {
    bgApp: '#ffffff',
    bgAppAlt: '#f4f5f7',
    bgElement: '#f0f0f3',
    bgSelected: '#e0e1e6',
    textPrimary: '#0b0f1a',
    textSecondary: '#60646c',
    border: '#e3e4e8',
    borderSubtle: '#ececed',
    accent: '#208aef',
    danger: '#e5484d',
    textOnAccent: '#ffffff',
    figureStroke: '#7c8aa0',
    dotDim: '#b8bdc7',
  },
  dark: {
    bgApp: '#070b14',
    bgAppAlt: '#0f1320',
    bgElement: '#161b27',
    bgSelected: '#1f2533',
    textPrimary: '#f5f7fa',
    textSecondary: '#9aa1ac',
    border: '#1f2533',
    borderSubtle: '#141925',
    accent: '#3a93f0',
    danger: '#ff6369',
    textOnAccent: '#ffffff',
    figureStroke: '#a5cfe8',
    dotDim: '#2a3448',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 9999,
} as const;

export const fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
})!;

export type ColorScheme = keyof typeof palette;
export type Colors = (typeof palette)[ColorScheme];

export interface Theme {
  scheme: ColorScheme;
  colors: Colors;
  spacing: typeof spacing;
  radius: typeof radius;
  fonts: typeof fonts;
  text: TypeScale;
  figureScale: number;
}

export function getTheme(scheme: ColorScheme, sizeLevel: SizeLevel = 1): Theme {
  return {
    scheme,
    colors: palette[scheme],
    spacing,
    radius,
    fonts,
    text: scaleType(sizeLevel),
    figureScale: figureScaleFor(sizeLevel),
  };
}
