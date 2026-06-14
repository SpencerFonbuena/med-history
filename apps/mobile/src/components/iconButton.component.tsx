import { Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { Icon, type IconName } from './icon.component';
import { makeIconButtonStyles } from './iconButton.styles';

/**
 * A tappable icon with an accessible 44x44 hit target. `plain` is transparent
 * (header/nav glyphs); `surface` adds a subtle filled background with a border.
 */
export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  variant = 'plain',
  size = 24,
  color,
}: {
  name: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'plain' | 'surface';
  size?: number;
  color?: string;
}) {
  const theme = useTheme();
  const styles = makeIconButtonStyles(theme);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        variant === 'surface' && styles.surface,
        pressed && styles.pressed,
      ]}
    >
      <Icon name={name} size={size} color={color} />
    </Pressable>
  );
}
