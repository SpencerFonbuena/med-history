import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '@/features/settings/context/appearance.provider';
import { useUpdateAppearance } from '@/features/settings/hooks/useUpdateAppearance.hook';
import { useTheme } from '@/hooks/useTheme.hook';

const PARAS = [
  'MedHistory stores everything you enter — profiles, visits, notes, prescriptions, and any documents — only on this device.',
  'There are no servers and no accounts. We cannot see, collect, or access your medical information, and neither can anyone else — not us, not a hospital, not an insurer — because it never leaves your phone.',
  'Because your records live only here, if you lose or reset this phone without a backup, they are permanently gone. We can’t recover them, because we never had them.',
  'A future update will let you export your data to a file and import it on another phone, so you can back it up or move it yourself, on your terms.',
];

export default function PrivacyStep() {
  const theme = useTheme();
  const { appearance, clearPreview } = useAppearance();
  const { commitOnboarding, saving } = useUpdateAppearance();
  const [ack, setAck] = useState(false);

  async function finish() {
    await commitOnboarding({ sizeLevel: appearance.sizeLevel, theme: appearance.scheme });
    clearPreview();
    router.replace('/');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgApp }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.largeTitle, fontWeight: '700' }}>
          Your data stays on this phone
        </Text>
        {PARAS.map((p, i) => (
          <Text key={i} style={{ color: theme.colors.textSecondary, fontSize: theme.text.body, lineHeight: theme.text.body * 1.4 }}>
            {p}
          </Text>
        ))}
        <Pressable onPress={() => setAck((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <View style={{ width: 24, height: 24, borderRadius: theme.radius.sm, borderWidth: 2, borderColor: theme.colors.accent, backgroundColor: ack ? theme.colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {ack && <Text style={{ color: '#ffffff' }}>{'✓'}</Text>}
          </View>
          <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.body, flex: 1 }}>
            I understand my data is stored only on this device.
          </Text>
        </Pressable>
      </ScrollView>
      <View style={{ padding: theme.spacing.lg }}>
        <Pressable
          disabled={!ack || saving}
          onPress={finish}
          style={{ padding: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center', backgroundColor: ack ? theme.colors.accent : theme.colors.bgSelected, opacity: saving ? 0.6 : 1 }}
        >
          <Text style={{ color: '#ffffff', fontSize: theme.text.callout, fontWeight: '600' }}>Get started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
