import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme.hook';
import { useMedicationSearch } from '../hooks/useMedicationSearch.hook';
import { MedicationSearchResult } from './medicationSearchResult.component';
import { makeMedicationSearchModalStyles } from './medicationSearchModal.styles';
import type { MedicationSelection } from '../schemas/medication';

export function MedicationSearchModal({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (selection: MedicationSelection) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const styles = makeMedicationSearchModalStyles(theme);
  // Read the root-measured insets via the hook rather than SafeAreaView: inside a
  // fullScreen Modal, SafeAreaView re-measures in a separate native hierarchy and
  // reads zero on first open, leaving the search bar under the notch.
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { results, seeding } = useMedicationSearch(query);
  const trimmed = query.trim();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search medications"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
          />
        </View>
        {seeding ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.hint}>Preparing medication list…</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(m) => m.rxcui}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              trimmed.length > 0 ? (
                <Pressable onPress={() => onSelect({ kind: 'freeText', name: trimmed })} style={styles.freeText}>
                  <Text style={styles.freeTextLabel}>Use "{trimmed}"</Text>
                </Pressable>
              ) : null
            }
            renderItem={({ item }) => (
              <MedicationSearchResult
                hit={item}
                onPress={() => onSelect({ kind: 'catalog', rxcui: item.rxcui, name: item.name, strength: item.strength, doseForm: item.doseForm })}
              />
            )}
          />
        )}
      </View>
    </Modal>
  );
}
