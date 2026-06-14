import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { QueryProvider } from '@/providers/QueryProvider';
import { AppearanceProvider } from '@/features/settings/context/appearance.provider';
import { useSettings } from '@/features/settings/hooks/useSettings.hook';
import { useTheme } from '@/hooks/useTheme.hook';

function Gate() {
  const { settings, loading } = useSettings();
  const segments = useSegments();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    if (loading || !settings) return;
    const inOnboarding = (segments[0] as string) === '(onboarding)';
    if (!settings.onboardingDone && !inOnboarding) {
      router.replace('/(onboarding)/size' as any);
    } else if (settings.onboardingDone && inOnboarding) {
      router.replace('/' as any);
    }
  }, [loading, settings, segments, router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="profile/new" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AppearanceProvider>
        <Gate />
      </AppearanceProvider>
    </QueryProvider>
  );
}
