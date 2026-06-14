import { FlatList, View } from 'react-native';
import type { Entry, EntryType } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { EmptyState } from '@/components/emptyState.component';
import { tabFor } from '../services/providers/entryTypes.provider';
import { EntryCard } from './entryCard.component';
import { makeEntryListStyles } from './entryList.styles';

export function EntryList({
  entries,
  type,
  onPressEntry,
  onAdd,
}: {
  entries: Entry[];
  type: EntryType;
  onPressEntry: (entry: Entry) => void;
  onAdd?: () => void;
}) {
  const theme = useTheme();
  const styles = makeEntryListStyles(theme);
  if (entries.length === 0) {
    const tab = tabFor(type);
    return (
      <EmptyState
        icon={tab.icon}
        title={tab.emptyTitle}
        subtitle={tab.emptyMessage}
        actionLabel={onAdd ? `Add ${tab.singular}` : undefined}
        onAction={onAdd}
      />
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
