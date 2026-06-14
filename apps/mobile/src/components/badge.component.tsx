import { Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { Icon, type IconName } from './icon.component';
import { makeBadgeStyles } from './badge.styles';

/** Small tinted pill with a leading icon and a label — used to tag entry types. */
export function Badge({ icon, label }: { icon: IconName; label: string }) {
  const theme = useTheme();
  const styles = makeBadgeStyles(theme);
  return (
    <View style={styles.badge}>
      <Icon name={icon} size={13} color={theme.colors.accent} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
