import { FlatList, Text, View } from 'react-native';
import type { Entry, EntryType } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { ENTRY_TABS } from '../services/providers/entryTypes.provider';
import { EntryCard } from './entryCard.component';
import { makeEntryListStyles } from './entryList.styles';

export function EntryList({
  entries,
  type,
  onPressEntry,
}: {
  entries: Entry[];
  type: EntryType;
  onPressEntry: (entry: Entry) => void;
}) {
  const theme = useTheme();
  const styles = makeEntryListStyles(theme);
  if (entries.length === 0) {
    const tab = ENTRY_TABS.find((t) => t.type === type)!;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>{tab.emptyIcon}</Text>
        <Text style={styles.emptyText}>{tab.emptyMessage}</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={entries}
      keyExtractor={(e) => e.id}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <EntryCard entry={item} onPress={() => onPressEntry(item)} />}
    />
  );
}
