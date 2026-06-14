import { Pressable, Text, View } from 'react-native';
import { SIZE_LEVELS, SIZE_LABELS, type SizeLevel } from '@/constants/appearance';
import { useTheme } from '@/hooks/useTheme.hook';

export function SizeSelector({ value, onChange }: { value: SizeLevel; onChange: (l: SizeLevel) => void }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {SIZE_LEVELS.map((level) => {
        const selected = level === value;
        return (
          <Pressable
            key={level}
            onPress={() => onChange(level)}
            style={{
              padding: theme.spacing.md,
              borderRadius: theme.radius.md,
              borderWidth: 2,
              borderColor: selected ? theme.colors.accent : theme.colors.border,
              backgroundColor: selected ? theme.colors.bgSelected : theme.colors.bgElement,
            }}
          >
            <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.callout }}>
              {SIZE_LABELS[level]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
