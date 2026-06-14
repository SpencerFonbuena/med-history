import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme.hook';
import { IconButton } from '@/components/iconButton.component';
import type { SizeLevel } from '@/constants/appearance';
import { useAppearance } from '../context/appearance.provider';
import { useUpdateAppearance } from '../hooks/useUpdateAppearance.hook';
import { ThemeSelector } from '../components/themeSelector.component';
import { SizeSelector } from '../components/sizeSelector.component';
import { PersonFigure } from '../components/personFigure.component';
import type { Scheme } from '../schemas/appearance';
import { makeSettingsStyles } from './settings.styles';

export function SettingsContainer() {
  const theme = useTheme();
  const styles = makeSettingsStyles(theme);
  const { appearance, setPreview } = useAppearance();
  const { update } = useUpdateAppearance();

  // Each change previews instantly (setPreview drives the live theme) and persists
  // in the background so it survives an app restart.
  function changeScheme(scheme: Scheme) {
    setPreview({ scheme });
    void update({ sizeLevel: appearance.sizeLevel, theme: scheme });
  }

  function changeSize(sizeLevel: SizeLevel) {
    setPreview({ sizeLevel });
    void update({ sizeLevel, theme: appearance.scheme });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <IconButton name="back" onPress={() => router.back()} accessibilityLabel="Go back" />
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <Text style={styles.sectionHint}>Choose how the app looks on this device.</Text>
          </View>
          <ThemeSelector value={appearance.scheme} onChange={changeScheme} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Text size</Text>
            <Text style={styles.sectionHint}>Make text larger or smaller to suit your eyes.</Text>
          </View>
          <View style={styles.preview}>
            <PersonFigure />
            <Text style={styles.previewText}>Sample text scales with your choice.</Text>
          </View>
          <SizeSelector value={appearance.sizeLevel} onChange={changeSize} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
