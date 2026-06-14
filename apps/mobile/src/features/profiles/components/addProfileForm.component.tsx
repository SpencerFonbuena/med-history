import { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme.hook';
import { profileForm, type ProfileFormValues } from '../schemas/profileForm';
import { toIsoDate } from '../utils/date';
import { makeAddProfileFormStyles } from './addProfileForm.styles';

type Sex = ProfileFormValues['sex'];

export function AddProfileForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (values: ProfileFormValues) => void;
  submitting: boolean;
}) {
  const theme = useTheme();
  const styles = makeAddProfileFormStyles(theme);
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

  return (
    <View style={styles.form}>
      <View>
        <Text style={styles.label}>Full name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sam Taylor"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.field, styles.fieldText]}
        />
      </View>

      <View>
        <Text style={styles.label}>Date of birth</Text>
        <Pressable onPress={() => setShowPicker(true)} style={styles.field}>
          <Text style={dob ? styles.dobValueFilled : styles.dobValuePlaceholder}>
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
        <Text style={styles.label}>Body outline</Text>
        <View style={styles.sexRow}>
          {(['male', 'female'] as Sex[]).map((opt) => {
            const selected = opt === sex;
            return (
              <Pressable
                key={opt}
                onPress={() => setSex(opt)}
                style={[styles.option, selected ? styles.optionSelected : styles.optionUnselected]}
              >
                <Text style={styles.optionLabel}>{opt === 'female' ? 'Female' : 'Male'}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable
        disabled={!canSubmit}
        onPress={submit}
        style={[styles.submit, canSubmit ? styles.submitEnabled : styles.submitDisabled, submitting && styles.submitting]}
      >
        <Text style={styles.submitLabel}>Create</Text>
      </Pressable>
    </View>
  );
}
