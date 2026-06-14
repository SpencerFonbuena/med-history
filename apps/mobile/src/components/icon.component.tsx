import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentType } from 'react';
import { useTheme } from '@/hooks/useTheme.hook';

/**
 * Semantic icon names used across the app. Adding a new icon means adding one
 * entry to ICON_REGISTRY below — call sites never reference a raw glyph name or
 * icon family, so the visual vocabulary stays consistent and swappable.
 */
export type IconName =
  | 'visit'
  | 'note'
  | 'prescription'
  | 'imaging_test'
  | 'settings'
  | 'back'
  | 'forward'
  | 'add'
  | 'person'
  | 'people'
  | 'trash'
  | 'check'
  | 'calendar';

interface RegistryEntry {
  // The icon families expose incompatible `name` unions, so the family is held
  // loosely here; the wrapper below is the only place this looseness lives.
  Family: ComponentType<{ name: string; size?: number; color?: string }>;
  name: string;
}

const ICON_REGISTRY: Record<IconName, RegistryEntry> = {
  // Medical concepts come from MaterialCommunityIcons (richest medical set).
  visit: { Family: MaterialCommunityIcons as never, name: 'stethoscope' },
  prescription: { Family: MaterialCommunityIcons as never, name: 'pill' },
  imaging_test: { Family: MaterialCommunityIcons as never, name: 'radiology-box-outline' },
  // UI chrome comes from Ionicons (clean, iOS-native feel).
  note: { Family: Ionicons as never, name: 'document-text-outline' },
  settings: { Family: Ionicons as never, name: 'settings-outline' },
  back: { Family: Ionicons as never, name: 'chevron-back' },
  forward: { Family: Ionicons as never, name: 'chevron-forward' },
  add: { Family: Ionicons as never, name: 'add' },
  person: { Family: Ionicons as never, name: 'person' },
  people: { Family: Ionicons as never, name: 'people-outline' },
  trash: { Family: Ionicons as never, name: 'trash-outline' },
  check: { Family: Ionicons as never, name: 'checkmark' },
  calendar: { Family: Ionicons as never, name: 'calendar-outline' },
};

/** Renders a themed vector icon by its semantic name. Defaults to secondary text color. */
export function Icon({
  name,
  size = 20,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const theme = useTheme();
  const { Family, name: glyph } = ICON_REGISTRY[name];
  return <Family name={glyph} size={size} color={color ?? theme.colors.textSecondary} />;
}
