import { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { EntryType } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { toIsoDate } from '@/features/profiles/utils/date';
import { entryForm, type EntryFormValues } from '../schemas/entryForm';
import { extrasFor } from '../services/providers/entryTypes.provider';
import { makeEntryFormStyles } from './entryForm.styles';
import { MedicationSearchModal } from '@/features/medications/components/medicationSearchModal.component';
import type { MedicationDetails } from '../schemas/medicationDetails';

type ExtraKey = 'doctor' | 'diagnosis' | 'prescriber' | 'duration' | 'facility';
const EXTRA_LABELS: Record<ExtraKey, string> = {
  doctor: 'Doctor', diagnosis: 'Diagnosis', prescriber: 'Prescriber', duration: 'Duration', facility: 'Facility',
};

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function EntryForm({
  type,
  initial,
  initialMedication,
  submitting,
  onSubmit,
  onDelete,
}: {
  type: EntryType;
  initial?: Partial<EntryFormValues>;
  initialMedication?: MedicationDetails;
  submitting: boolean;
  onSubmit: (values: EntryFormValues, medication?: MedicationDetails) => void;
  onDelete?: () => void;
}) {
  const theme = useTheme();
  const styles = makeEntryFormStyles(theme);
  const [date, setDate] = useState<Date>(initial?.date ? parseIso(initial.date) : new Date());
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [extras, setExtras] = useState<Record<ExtraKey, string>>({
    doctor: initial?.doctor ?? '',
    diagnosis: initial?.diagnosis ?? '',
    prescriber: initial?.prescriber ?? '',
    duration: initial?.duration ?? '',
    facility: initial?.facility ?? '',
  });
  const [subtype, setSubtype] = useState<'imaging' | 'lab'>(initial?.subtype ?? 'imaging');
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medication, setMedication] = useState<MedicationDetails | null>(initialMedication ?? null);
  const [medSearchVisible, setMedSearchVisible] = useState(false);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !submitting;

  function submit() {
    const parsed = entryForm.safeParse({
      date: toIsoDate(date),
      title,
      body,
      ...extras,
      ...(type === 'imaging_test' ? { subtype } : {}),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your entries.');
      return;
    }
    setError(null);
    onSubmit(parsed.data, type === 'prescription' ? (medication ?? undefined) : undefined);
  }

  return (
    <View style={styles.form}>
      <View>
        <Text style={styles.fieldLabel}>Date</Text>
        <Pressable onPress={() => setShowPicker(true)} style={styles.field}>
          <Text style={styles.dateValue}>{toIsoDate(date)}</Text>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_event, picked) => {
              setShowPicker(Platform.OS === 'ios');
              if (picked) setDate(picked);
            }}
          />
        )}
      </View>

      {type === 'prescription' ? (
        <View>
          <Text style={styles.fieldLabel}>Medication</Text>
          <Pressable onPress={() => setMedSearchVisible(true)} style={styles.medField}>
            <Text style={[styles.medValue, { color: title ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
              {title || 'Select medication'}
            </Text>
          </Pressable>
          <MedicationSearchModal
            visible={medSearchVisible}
            onClose={() => setMedSearchVisible(false)}
            onSelect={(sel) => {
              setTitle(sel.name);
              setMedication(sel.kind === 'catalog' ? { rxcui: sel.rxcui, strength: sel.strength, doseForm: sel.doseForm } : null);
              setMedSearchVisible(false);
            }}
          />
        </View>
      ) : (
        <View>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Short headline"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.field, styles.fieldText]}
          />
        </View>
      )}

      <View>
        <Text style={styles.fieldLabel}>Details</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          placeholder="What happened, what you noticed, etc."
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.field, styles.fieldText, styles.bodyInput]}
        />
      </View>

      {extrasFor(type).map((key) => (
        <View key={key}>
          <Text style={styles.fieldLabel}>{EXTRA_LABELS[key]}</Text>
          <TextInput
            value={extras[key]}
            onChangeText={(v) => setExtras((prev) => ({ ...prev, [key]: v }))}
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.field, styles.fieldText]}
          />
        </View>
      ))}

      {type === 'imaging_test' && (
        <View>
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.toggleRow}>
            {(['imaging', 'lab'] as const).map((opt) => {
              const selected = opt === subtype;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setSubtype(opt)}
                  style={[styles.toggleOption, selected && styles.toggleOptionSelected]}
                >
                  <Text style={styles.toggleLabel}>{opt === 'lab' ? 'Lab' : 'Imaging'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable disabled={!canSubmit} onPress={submit} style={[styles.save, !canSubmit && styles.saveDisabled]}>
        <Text style={styles.saveLabel}>Save</Text>
      </Pressable>

      {onDelete && (
        <Pressable onPress={onDelete} style={styles.delete}>
          <Text style={styles.deleteLabel}>Delete entry</Text>
        </Pressable>
      )}
    </View>
  );
}
