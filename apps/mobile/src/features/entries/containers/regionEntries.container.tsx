import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { Entry, EntryType } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { Icon } from '@/components/icon.component';
import { IconButton } from '@/components/iconButton.component';
import { useRegionEntries } from '../hooks/useRegionEntries.hook';
import { EntryTypeTabs } from '../components/entryTypeTabs.component';
import { EntryList } from '../components/entryList.component';
import { makeRegionEntriesStyles } from './regionEntries.styles';

export function RegionEntriesContainer() {
  const theme = useTheme();
  const styles = makeRegionEntriesStyles(theme);
  const { id, code, label } = useLocalSearchParams<{ id: string; code: string; label?: string }>();
  const [type, setType] = useState<EntryType>('visit');
  const { entries } = useRegionEntries(id ?? '', code ?? '', type);

  const title = label ?? code ?? '';
  const openNew = () =>
    router.push(`/profile/${id}/region/${code}/new?type=${type}&label=${encodeURIComponent(title)}` as any);
  const openEdit = (entry: Entry) =>
    router.push(`/profile/${id}/region/${code}/${entry.id}?label=${encodeURIComponent(title)}` as any);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <IconButton name="back" onPress={() => router.back()} accessibilityLabel="Go back" />
        <Text style={styles.title}>{title}</Text>
      </View>
      <EntryTypeTabs active={type} onChange={setType} />
      <View style={styles.listWrap}>
        <EntryList entries={entries} type={type} onPressEntry={openEdit} onAdd={openNew} />
      </View>
      <Pressable onPress={openNew} style={styles.fab} accessibilityRole="button" accessibilityLabel="Add entry">
        <Icon name="add" size={28} color={theme.colors.textOnAccent} />
      </Pressable>
    </SafeAreaView>
  );
}
