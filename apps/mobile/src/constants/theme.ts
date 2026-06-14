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
    accentSoft: '#e6f1fd',
    danger: '#e5484d',
    dangerSoft: '#fdecec',
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
    accentSoft: '#15263b',
    danger: '#ff6369',
    dangerSoft: '#2e1718',
    textOnAccent: '#ffffff',
    figureStroke: '#a5cfe8',
    dotDim: '#2a3448',
  },
} as const;

/**
 * Per-entry-type accent colors. Each type gets a `fg` (icon/label) and a `soft`
 * (badge fill) so visits, notes, prescriptions, and results are distinguishable
 * at a glance. Keyed by EntryType from @med-history/core.
 */
const category = {
  light: {
    visit: { fg: '#208aef', soft: '#e6f1fd' },
    note: { fg: '#7b61ff', soft: '#efeaff' },
    prescription: { fg: '#0f9d8f', soft: '#dbf6f1' },
    imaging_test: { fg: '#d9890a', soft: '#fbeed4' },
  },
  dark: {
    visit: { fg: '#5aa6f4', soft: '#13243a' },
    note: { fg: '#a48cff', soft: '#1d1838' },
    prescription: { fg: '#2dd4bf', soft: '#0c2b28' },
    imaging_test: { fg: '#f0b44e', soft: '#2c2210' },
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

/**
 * Elevation presets for floating surfaces (FAB, cards). iOS reads the shadow*
 * props; Android reads `elevation`. Shadow color is black on both themes — a
 * subtle shadow reads correctly over light and dark backgrounds alike.
 */
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const;

export const fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
})!;

export type ColorScheme = keyof typeof palette;
export type Colors = (typeof palette)[ColorScheme];
export type CategoryColors = (typeof category)[ColorScheme];

export interface Theme {
  scheme: ColorScheme;
  colors: Colors;
  category: CategoryColors;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadow;
  fonts: typeof fonts;
  text: TypeScale;
  figureScale: number;
}

export function getTheme(scheme: ColorScheme, sizeLevel: SizeLevel = 1): Theme {
  return {
    scheme,
    colors: palette[scheme],
    category: category[scheme],
    spacing,
    radius,
    shadow,
    fonts,
    text: scaleType(sizeLevel),
    figureScale: figureScaleFor(sizeLevel),
  };
}
