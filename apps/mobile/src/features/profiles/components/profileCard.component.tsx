import { Pressable, Text, View } from 'react-native';
import type { Profile } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { calcAge } from '../utils/date';
import { ProfileAvatar } from './profileAvatar.component';

export function ProfileCard({ profile, onPress }: { profile: Profile; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.bgElement,
      }}
    >
      <ProfileAvatar sex={profile.sex} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.callout, fontWeight: '600' }}>
          {profile.name}
        </Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.text.footnote }}>
          {`Age ${calcAge(profile.dob)} · ${profile.sex === 'female' ? 'Female' : 'Male'}`}
        </Text>
      </View>
      <Text style={{ color: theme.colors.textSecondary, fontSize: theme.text.title }}>{'›'}</Text>
    </Pressable>
  );
}
