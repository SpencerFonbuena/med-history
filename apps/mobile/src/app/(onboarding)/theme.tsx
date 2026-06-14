import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '@/features/settings/context/appearance.provider';
import { ThemeSelector } from '@/features/settings/components/themeSelector.component';
import { useTheme } from '@/hooks/useTheme.hook';
import type { Scheme } from '@/features/settings/schemas/appearance';

export default function ThemeStep() {
  const { appearance, setPreview } = useAppearance();
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgApp, padding: theme.spacing.lg }}>
      <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '600', marginBottom: theme.spacing.lg }}>
        Light or dark?
      </Text>
      <ThemeSelector value={appearance.scheme} onChange={(s: Scheme) => setPreview({ scheme: s })} />
      <View style={{ flex: 1 }} />
      <Pressable
        onPress={() => router.push('/(onboarding)/privacy' as any)}
        style={{ padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.accent, alignItems: 'center' }}
      >
        <Text style={{ color: '#ffffff', fontSize: theme.text.callout, fontWeight: '600' }}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}
