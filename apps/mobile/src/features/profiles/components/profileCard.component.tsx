import { Pressable, Text, View } from 'react-native';
import type { Profile } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { Icon } from '@/components/icon.component';
import { calcAge } from '../utils/date';
import { ProfileAvatar } from './profileAvatar.component';
import { makeProfileCardStyles } from './profileCard.styles';

export function ProfileCard({ profile, onPress }: { profile: Profile; onPress: () => void }) {
  const theme = useTheme();
  const styles = makeProfileCardStyles(theme);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <ProfileAvatar sex={profile.sex} />
      <View style={styles.info}>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.meta}>
          {`Age ${calcAge(profile.dob)} · ${profile.sex === 'female' ? 'Female' : 'Male'}`}
        </Text>
      </View>
      <Icon name="forward" size={18} color={theme.colors.dotDim} />
    </Pressable>
  );
}
