import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme.hook';
import { useEntry } from '../hooks/useEntry.hook';
import { useUpdateEntry } from '../hooks/useUpdateEntry.hook';
import { useDeleteEntry } from '../hooks/useDeleteEntry.hook';
import { EntryForm } from '../components/entryForm.component';
import { buildUpdateInput } from '../services/providers/entryTypes.provider';
import { makeEntryModalStyles } from './entryModal.styles';

export function EditEntryContainer() {
  const theme = useTheme();
  const styles = makeEntryModalStyles(theme);
  const { entryId, label } = useLocalSearchParams<{ entryId: string; label?: string }>();
  const { entry, loading } = useEntry(entryId ?? '');
  const { updateEntry, saving } = useUpdateEntry();
  const { deleteEntry } = useDeleteEntry();

  if (loading || !entry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>{loading && <ActivityIndicator color={theme.colors.accent} />}</View>
      </SafeAreaView>
    );
  }

  function confirmDelete() {
    const currentEntry = entry!;
    Alert.alert('Delete entry', 'Delete this entry? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(currentEntry.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit entry</Text>
        {label && <Text style={styles.subtitle}>{label}</Text>}
        <EntryForm
          type={entry.type}
          initial={{
            date: entry.date,
            title: entry.title,
            body: entry.body,
            doctor: entry.doctor ?? undefined,
            diagnosis: entry.diagnosis ?? undefined,
            prescriber: entry.prescriber ?? undefined,
            duration: entry.duration ?? undefined,
            facility: entry.facility ?? undefined,
            subtype: entry.subtype ?? undefined,
          }}
          submitting={saving}
          onSubmit={async (values) => {
            await updateEntry(entry.id, buildUpdateInput(entry.type, values));
            router.back();
          }}
          onDelete={confirmDelete}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
