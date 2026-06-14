import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme.hook';
import { Icon } from '@/components/icon.component';
import { IconButton } from '@/components/iconButton.component';
import { useProfiles } from '../hooks/useProfiles.hook';
import { useDeleteProfile } from '../hooks/useDeleteProfile.hook';
import { calcAge } from '../utils/date';
import { makeProfileSettingsStyles } from './profileSettings.styles';

export function ProfileSettingsContainer() {
  const theme = useTheme();
  const styles = makeProfileSettingsStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles } = useProfiles();
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <IconButton name="back" onPress={() => router.back()} accessibilityLabel="Go back" />
        <Text style={styles.title}>Profile settings</Text>
      </View>
      {profile && (
        <View style={styles.content}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.meta}>
            {`Age ${calcAge(profile.dob)} · ${profile.sex === 'female' ? 'Female' : 'Male'}`}
          </Text>
        </View>
      )}
      <View style={styles.footer}>
        <Pressable disabled={deleting} onPress={confirmDelete} style={styles.deleteButton}>
          <Icon name="trash" size={18} color={theme.colors.danger} />
          <Text style={styles.deleteLabel}>Delete profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
