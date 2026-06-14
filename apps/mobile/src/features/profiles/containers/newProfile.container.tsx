import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
      <KeyboardAwareScrollView
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid
        extraScrollHeight={24}
        keyboardShouldPersistTaps="handled"
      >
        <AddProfileForm
          submitting={saving}
          onSubmit={async (values) => {
            await createProfile(values);
            router.back();
          }}
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
