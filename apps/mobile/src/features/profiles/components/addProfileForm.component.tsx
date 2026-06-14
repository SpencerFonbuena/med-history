import { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme.hook';
import { profileForm, type ProfileFormValues } from '../schemas/profileForm';
import { toIsoDate } from '../utils/date';

type Sex = ProfileFormValues['sex'];

export function AddProfileForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (values: ProfileFormValues) => void;
  submitting: boolean;
}) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [sex, setSex] = useState<Sex>('male');
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dob = date ? toIsoDate(date) : '';
  const canSubmit = name.trim().length > 0 && dob.length > 0 && !submitting;

  function submit() {
    const parsed = profileForm.safeParse({ name, dob, sex });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your entries.');
      return;
    }
    setError(null);
    onSubmit(parsed.data);
  }

  const fieldStyle = {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
  } as const;

  return (
    <View style={{ gap: theme.spacing.md }}>
      <View>
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.text.footnote }}>Full name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sam Taylor"
          placeholderTextColor={theme.colors.textSecondary}
          style={[fieldStyle, { color: theme.colors.textPrimary, fontSize: theme.text.body }]}
        />
      </View>

      <View>
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.text.footnote }}>Date of birth</Text>
        <Pressable onPress={() => setShowPicker(true)} style={fieldStyle}>
          <Text style={{ color: dob ? theme.colors.textPrimary : theme.colors.textSecondary, fontSize: theme.text.body }}>
            {dob || 'Select date'}
          </Text>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={date ?? new Date(1980, 0, 1)}
            mode="date"
            maximumDate={new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_event, picked) => {
              setShowPicker(Platform.OS === 'ios');
              if (picked) setDate(picked);
            }}
          />
        )}
      </View>

      <View>
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.text.footnote }}>Body outline</Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {(['male', 'female'] as Sex[]).map((opt) => {
            const selected = opt === sex;
            return (
              <Pressable
                key={opt}
                onPress={() => setSex(opt)}
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.sm,
                  borderWidth: 2,
                  borderColor: selected ? theme.colors.accent : theme.colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: theme.colors.textPrimary, fontSize: theme.text.body }}>
                  {opt === 'female' ? 'Female' : 'Male'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error && <Text style={{ color: '#e5484d', fontSize: theme.text.footnote }}>{error}</Text>}

      <Pressable
        disabled={!canSubmit}
        onPress={submit}
        style={{
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          alignItems: 'center',
          backgroundColor: canSubmit ? theme.colors.accent : theme.colors.bgSelected,
          opacity: submitting ? 0.6 : 1,
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: theme.text.callout, fontWeight: '600' }}>Create</Text>
      </Pressable>
    </View>
  );
}
