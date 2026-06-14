import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { makeBodyViewToggleStyles } from './bodyViewToggle.styles';

export type BodyView = 'front' | 'back';

export function BodyViewToggle({
  view,
  onChange,
}: {
  view: BodyView;
  onChange: (view: BodyView) => void;
}) {
  const theme = useTheme();
  const styles = makeBodyViewToggleStyles(theme);
  return (
    <View style={styles.row}>
      {(['front', 'back'] as BodyView[]).map((opt) => {
        const selected = opt === view;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {opt === 'front' ? 'Front' : 'Back'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
