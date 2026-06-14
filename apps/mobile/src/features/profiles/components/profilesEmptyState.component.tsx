import { Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';

export function ProfilesEmptyState() {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.xxl }}>
      <Text style={{ fontSize: 40 }}>{'👤'}</Text>
      <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.subtitle, fontWeight: '600' }}>
        No profiles yet
      </Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: theme.text.body, textAlign: 'center' }}>
        Add a profile to start tracking medical history on this device.
      </Text>
    </View>
  );
}
