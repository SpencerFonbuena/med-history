import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme.hook';
import { makeHomeStyles } from './index.styles';

// Placeholder home screen. Per mobile.md §3 a screen renders one container and nothing
// else — this will be replaced by the Profiles feature/portal container once we build it.
export default function HomeScreen() {
  const theme = useTheme();
  const styles = makeHomeStyles(theme);
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'MedHistory' }} />
      <View style={styles.center}>
        <Text style={[styles.title, { fontSize: theme.text.largeTitle }]}>MedHistory</Text>
        <Text style={[styles.subtitle, { fontSize: theme.text.body }]}>You're all set.</Text>
      </View>
    </SafeAreaView>
  );
}
