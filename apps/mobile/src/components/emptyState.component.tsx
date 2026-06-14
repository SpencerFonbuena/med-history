import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { Icon, type IconName } from './icon.component';
import { makeEmptyStateStyles } from './emptyState.styles';

/**
 * Centered empty-state block: a tinted icon badge, a title, supporting copy, and
 * an optional call-to-action button. Used wherever a list or screen has no data.
 */
export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  const styles = makeEmptyStateStyles(theme);
  return (
    <View style={styles.container}>
      <View style={styles.iconBadge}>
        <Icon name={icon} size={34} color={theme.colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={styles.action} accessibilityRole="button">
          <Icon name="add" size={18} color={theme.colors.textOnAccent} />
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
