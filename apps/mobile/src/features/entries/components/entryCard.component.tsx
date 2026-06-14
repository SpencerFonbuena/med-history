import { Pressable, Text, View } from 'react-native';
import type { Entry } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { Icon } from '@/components/icon.component';
import { formatEntryDate } from '../utils/entryDate';
import { entryMeta, tabFor } from '../services/providers/entryTypes.provider';
import { makeEntryCardStyles } from './entryCard.styles';

export function EntryCard({ entry, onPress }: { entry: Entry; onPress: () => void }) {
  const theme = useTheme();
  const styles = makeEntryCardStyles(theme);
  const meta = entryMeta(entry);
  const tab = tabFor(entry.type);
  const cat = theme.category[entry.type];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { borderLeftColor: cat.fg }, pressed && styles.pressed]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: cat.soft }]}>
          <Icon name={tab.icon} size={18} color={cat.fg} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.type, { color: cat.fg }]}>{tab.singular.toUpperCase()}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {entry.title}
          </Text>
        </View>
        <Text style={styles.date}>{formatEntryDate(entry.date)}</Text>
      </View>

      {entry.body ? (
        <Text style={styles.body} numberOfLines={3}>
          {entry.body}
        </Text>
      ) : null}

      {meta.length > 0 && (
        <View style={styles.metaGrid}>
          {meta.map((m) => (
            <View key={m.label} style={styles.metaItem}>
              <Text style={styles.metaLabel}>{m.label}</Text>
              <Text style={styles.metaValue}>{m.value}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}
