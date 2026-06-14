import { Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { makeProfilesEmptyStateStyles } from './profilesEmptyState.styles';

export function ProfilesEmptyState() {
  const theme = useTheme();
  const styles = makeProfilesEmptyStateStyles(theme);
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{'👤'}</Text>
      <Text style={styles.heading}>No profiles yet</Text>
      <Text style={styles.body}>
        Add a profile to start tracking medical history on this device.
      </Text>
    </View>
  );
}
