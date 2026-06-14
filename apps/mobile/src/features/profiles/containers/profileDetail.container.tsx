import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme.hook';
import { useProfiles } from '../hooks/useProfiles.hook';
import { useDeleteProfile } from '../hooks/useDeleteProfile.hook';
import { ProfileAvatar } from '../components/profileAvatar.component';
import { calcAge } from '../utils/date';
import { makeProfileDetailStyles } from './profileDetail.styles';

export function ProfileDetailContainer() {
  const theme = useTheme();
  const styles = makeProfileDetailStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles, loading } = useProfiles();
  const { deleteProfile, deleting } = useDeleteProfile();
  const profile = profiles.find((p) => p.id === id);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return <SafeAreaView style={styles.safeArea} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <ProfileAvatar sex={profile.sex} base={88} />
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.meta}>
          {`Age ${calcAge(profile.dob)} · ${profile.sex === 'female' ? 'Female' : 'Male'}`}
        </Text>
        <Text style={styles.bodyPlaceholder}>Body screen coming next.</Text>
      </View>
      <View style={styles.footer}>
        <Pressable
          disabled={deleting}
          onPress={confirmDelete}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteLabel}>Delete profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
