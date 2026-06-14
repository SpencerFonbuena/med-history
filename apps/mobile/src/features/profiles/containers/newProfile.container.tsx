import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme.hook';
import { useCreateProfile } from '../hooks/useCreateProfile.hook';
import { AddProfileForm } from '../components/addProfileForm.component';
import { makeNewProfileStyles } from './newProfile.styles';

export function NewProfileContainer() {
  const theme = useTheme();
  const styles = makeNewProfileStyles(theme);
  const { createProfile, saving } = useCreateProfile();
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
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
