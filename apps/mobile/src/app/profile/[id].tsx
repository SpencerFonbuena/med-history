import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfiles } from '@/features/profiles/hooks/useProfiles.hook';
import { useDeleteProfile } from '@/features/profiles/hooks/useDeleteProfile.hook';
import { ProfileAvatar } from '@/features/profiles/components/profileAvatar.component';
import { calcAge } from '@/features/profiles/utils/date';
import { useTheme } from '@/hooks/useTheme.hook';

export default function ProfileScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles } = useProfiles();
  const { deleteProfile, deleting } = useDeleteProfile();
  const profile = profiles.find((p) => p.id === id);

  if (!profile) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgApp }} />;
  }

  function confirmDelete() {
    if (!profile) return;
    Alert.alert(
      'Delete profile',
      `Delete ${profile.name} and all their history? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProfile(profile.id);
            router.replace('/' as any);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgApp }}>
      <View style={{ flex: 1, padding: theme.spacing.lg, alignItems: 'center', gap: theme.spacing.md }}>
        <ProfileAvatar sex={profile.sex} base={88} />
        <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.largeTitle, fontWeight: '700' }}>
          {profile.name}
        </Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.text.body }}>
          {`Age ${calcAge(profile.dob)} · ${profile.sex === 'female' ? 'Female' : 'Male'}`}
        </Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.text.body, marginTop: theme.spacing.lg }}>
          Body screen coming next.
        </Text>
      </View>
      <View style={{ padding: theme.spacing.lg }}>
        <Pressable
          disabled={deleting}
          onPress={confirmDelete}
          style={{ padding: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center', borderWidth: 1, borderColor: '#e5484d' }}
        >
          <Text style={{ color: '#e5484d', fontSize: theme.text.callout, fontWeight: '600' }}>Delete profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
