import { Pressable, Text, View } from 'react-native';
import type { Scheme } from '../schemas/appearance';
import { useTheme } from '@/hooks/useTheme.hook';

const OPTIONS: { value: Scheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeSelector({ value, onChange }: { value: Scheme; onChange: (s: Scheme) => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
      {OPTIONS.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.md,
              borderWidth: 2,
              borderColor: selected ? theme.colors.accent : theme.colors.border,
              backgroundColor: opt.value === 'dark' ? '#070b14' : '#ffffff',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: opt.value === 'dark' ? '#f5f7fa' : '#0b0f1a', fontSize: theme.text.callout }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
