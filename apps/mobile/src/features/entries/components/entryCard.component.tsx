import { Pressable, Text, View } from 'react-native';
import type { Entry } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { formatEntryDate } from '../utils/entryDate';
import { entryMeta } from '../services/providers/entryTypes.provider';
import { makeEntryCardStyles } from './entryCard.styles';

export function EntryCard({ entry, onPress }: { entry: Entry; onPress: () => void }) {
  const theme = useTheme();
  const styles = makeEntryCardStyles(theme);
  const meta = entryMeta(entry);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.date}>{formatEntryDate(entry.date)}</Text>
      </View>
      <Text style={styles.body}>{entry.body}</Text>
      {meta.length > 0 && (
        <View style={styles.metaRow}>
          {meta.map((m) => (
            <Text key={m.label} style={styles.meta}>
              <Text style={styles.metaLabel}>{m.label} </Text>
              {m.value}
            </Text>
          ))}
        </View>
      )}
    </Pressable>
  );
}
