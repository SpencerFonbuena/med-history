import { Pressable, ScrollView, Text } from 'react-native';
import type { EntryType } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { ENTRY_TABS } from '../services/providers/entryTypes.provider';
import { makeEntryTypeTabsStyles } from './entryTypeTabs.styles';

export function EntryTypeTabs({ active, onChange }: { active: EntryType; onChange: (type: EntryType) => void }) {
  const theme = useTheme();
  const styles = makeEntryTypeTabsStyles(theme);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {ENTRY_TABS.map((tab) => {
        const selected = tab.type === active;
        return (
          <Pressable key={tab.type} onPress={() => onChange(tab.type)} style={[styles.tab, selected && styles.tabSelected]}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
