import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { makeGeneralControlStyles } from './generalControl.styles';

/** Always-present control for region-less ("General") entries; lit when it holds any. */
export function GeneralControl({ lit, onPress }: { lit: boolean; onPress: () => void }) {
  const theme = useTheme();
  const styles = makeGeneralControlStyles(theme);
  return (
    <Pressable onPress={onPress} style={[styles.pill, lit && styles.pillLit]}>
      <View style={[styles.indicator, lit && styles.indicatorLit]} />
      <Text style={[styles.label, lit && styles.labelLit]}>General</Text>
    </Pressable>
  );
}
