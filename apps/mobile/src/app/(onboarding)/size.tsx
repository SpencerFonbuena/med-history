import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '@/features/settings/context/appearance.provider';
import { SizeSelector } from '@/features/settings/components/sizeSelector.component';
import { PersonFigure } from '@/features/settings/components/personFigure.component';
import { useTheme } from '@/hooks/useTheme.hook';
import type { SizeLevel } from '@/constants/appearance';

export default function SizeStep() {
  const { appearance, setPreview } = useAppearance();
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgApp, padding: theme.spacing.lg }}>
      <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.title, fontWeight: '600' }}>
        Choose a comfortable size
      </Text>
      <View style={{ alignItems: 'center', paddingVertical: theme.spacing.lg, gap: theme.spacing.sm }}>
        <PersonFigure />
        <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.body }}>
          Sample text scales with your choice.
        </Text>
      </View>
      <SizeSelector value={appearance.sizeLevel} onChange={(l: SizeLevel) => setPreview({ sizeLevel: l })} />
      <Pressable
        onPress={() => router.push('/(onboarding)/theme' as any)}
        style={{ marginTop: theme.spacing.lg, padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.accent, alignItems: 'center' }}
      >
        <Text style={{ color: '#ffffff', fontSize: theme.text.callout, fontWeight: '600' }}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}
