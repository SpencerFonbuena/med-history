import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Root navigation shell. Routing only — no logic, no data (see mobile.md §3).
// A <QueryProvider> wrapper will be added here when the data layer lands.
export default function RootLayout() {
  return (
    <>
      <Stack />
      <StatusBar style="auto" />
    </>
  );
}
