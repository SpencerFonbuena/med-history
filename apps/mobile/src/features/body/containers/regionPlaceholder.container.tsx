import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme.hook';
import { useBodyMap } from '../hooks/useBodyMap.hook';
import { regionParamToCode, GENERAL_PARAM } from '../utils/regionParam';
import { makeRegionPlaceholderStyles } from './regionPlaceholder.styles';

export function RegionPlaceholderContainer() {
  const theme = useTheme();
  const styles = makeRegionPlaceholderStyles(theme);
  const { id, code } = useLocalSearchParams<{ id: string; code: string }>();
  const { bodyMap } = useBodyMap(id ?? '');

  const regionCode = regionParamToCode(code ?? '');
  const label =
    code === GENERAL_PARAM
      ? 'General'
      : [...(bodyMap?.front ?? []), ...(bodyMap?.back ?? [])].find((d) => d.code === regionCode)
          ?.label ?? (code ?? '');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backGlyph}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.title}>{label}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.bodyText}>Entries coming next.</Text>
      </View>
    </SafeAreaView>
  );
}
