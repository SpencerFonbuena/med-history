import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme.hook';
import { IconButton } from '@/components/iconButton.component';
import { useProfiles } from '@/features/profiles/hooks/useProfiles.hook';
import { calcAge } from '@/features/profiles/utils/date';
import { useBodyMap } from '../hooks/useBodyMap.hook';
import { BodySilhouette } from '../components/bodySilhouette.component';
import { RegionDot } from '../components/regionDot.component';
import { BodyViewToggle, type BodyView } from '../components/bodyViewToggle.component';
import { GeneralControl } from '../components/generalControl.component';
import { makeBodyScreenStyles } from './bodyScreen.styles';

export function BodyScreenContainer() {
  const theme = useTheme();
  const styles = makeBodyScreenStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { profiles } = useProfiles();
  const { bodyMap, loading } = useBodyMap(id ?? '');
  const [view, setView] = useState<BodyView>('front');

  const profile = profiles.find((p) => p.id === id);
  const size = Math.min(width - theme.spacing.lg * 2, 410) * theme.figureScale;
  const dots = view === 'front' ? bodyMap?.front ?? [] : bodyMap?.back ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <IconButton name="back" onPress={() => router.back()} accessibilityLabel="Go back" />
        <View style={styles.headerText}>
          <Text style={styles.name}>{profile?.name ?? ''}</Text>
          {profile && (
            <Text style={styles.meta}>
              {`Age ${calcAge(profile.dob)} · ${profile.sex === 'female' ? 'Female' : 'Male'}`}
            </Text>
          )}
        </View>
        <IconButton
          name="settings"
          variant="surface"
          size={20}
          onPress={() => router.push(`/profile/${id}/settings` as any)}
          accessibilityLabel="Profile settings"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.accent} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <BodyViewToggle view={view} onChange={setView} />
          <Text style={styles.hint}>Glowing markers indicate logged history</Text>
          <View style={styles.figureWrap}>
            <BodySilhouette size={size}>
              {dots.map((dot) => (
                <RegionDot
                  key={dot.code}
                  dot={dot}
                  onPress={() =>
                    router.push(
                      `/profile/${id}/region/${dot.code}?label=${encodeURIComponent(dot.label)}` as any,
                    )
                  }
                />
              ))}
            </BodySilhouette>
          </View>
          <GeneralControl
            lit={(bodyMap?.generalCount ?? 0) > 0}
            onPress={() => router.push(`/profile/${id}/region/general?label=General` as any)}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
