import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme.hook';
import { useProfiles } from '../hooks/useProfiles.hook';
import { ProfileCard } from '../components/profileCard.component';
import { ProfilesEmptyState } from '../components/profilesEmptyState.component';
import { makeProfilesStyles } from './profiles.styles';

export function ProfilesContainer() {
  const theme = useTheme();
  const styles = makeProfilesStyles(theme);
  const { profiles, loading } = useProfiles();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.heading}>Profiles</Text>
        {loading ? (
          <ActivityIndicator color={theme.colors.accent} />
        ) : profiles.length === 0 ? (
          <ProfilesEmptyState />
        ) : (
          <FlatList
            data={profiles}
            keyExtractor={(p) => p.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <ProfileCard profile={item} onPress={() => router.push(`/profile/${item.id}` as any)} />
            )}
          />
        )}
      </View>
      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push('/profile/new' as any)}
          style={styles.addButton}
        >
          <Text style={styles.addButtonLabel}>+ Add profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
