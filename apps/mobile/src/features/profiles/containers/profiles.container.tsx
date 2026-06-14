import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfiles } from '../hooks/useProfiles.hook';
import { ProfileCard } from '../components/profileCard.component';
import { ProfilesEmptyState } from '../components/profilesEmptyState.component';
import { useTheme } from '@/hooks/useTheme.hook';

export function ProfilesContainer() {
  const theme = useTheme();
  const { profiles, loading } = useProfiles();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgApp }}>
      <View style={{ flex: 1, padding: theme.spacing.lg }}>
        <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.largeTitle, fontWeight: '700', marginBottom: theme.spacing.md }}>
          Profiles
        </Text>
        {loading ? (
          <ActivityIndicator color={theme.colors.accent} />
        ) : profiles.length === 0 ? (
          <ProfilesEmptyState />
        ) : (
          <FlatList
            data={profiles}
            keyExtractor={(p) => p.id}
            ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
            renderItem={({ item }) => (
              <ProfileCard profile={item} onPress={() => router.push(`/profile/${item.id}` as any)} />
            )}
          />
        )}
      </View>
      <View style={{ padding: theme.spacing.lg }}>
        <Pressable
          onPress={() => router.push('/profile/new' as any)}
          style={{ padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.accent, alignItems: 'center' }}
        >
          <Text style={{ color: '#ffffff', fontSize: theme.text.callout, fontWeight: '600' }}>+ Add profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
