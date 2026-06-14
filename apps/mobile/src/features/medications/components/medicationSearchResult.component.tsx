import { Pressable, Text } from 'react-native';
import type { MedicationHit } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { makeMedicationSearchResultStyles } from './medicationSearchResult.styles';

export function MedicationSearchResult({ hit, onPress }: { hit: MedicationHit; onPress: () => void }) {
  const theme = useTheme();
  const styles = makeMedicationSearchResultStyles(theme);
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.name}>{hit.name}</Text>
    </Pressable>
  );
}
