import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddProfileForm } from '@/features/profiles/components/addProfileForm.component';
import { useCreateProfile } from '@/features/profiles/hooks/useCreateProfile.hook';
import { useTheme } from '@/hooks/useTheme.hook';

export default function NewProfileScreen() {
  const theme = useTheme();
  const { createProfile, saving } = useCreateProfile();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgApp }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <AddProfileForm
          submitting={saving}
          onSubmit={async (values) => {
            await createProfile(values);
            router.back();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
