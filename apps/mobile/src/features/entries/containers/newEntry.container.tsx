import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { EntryType } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { regionParamToCode } from '@/features/body/utils/regionParam';
import { useCreateEntry } from '../hooks/useCreateEntry.hook';
import { EntryForm } from '../components/entryForm.component';
import { buildCreateInput } from '../services/providers/entryTypes.provider';
import { makeEntryModalStyles } from './entryModal.styles';

export function NewEntryContainer() {
  const theme = useTheme();
  const styles = makeEntryModalStyles(theme);
  const { id, code, type, label } = useLocalSearchParams<{ id: string; code: string; type: EntryType; label?: string }>();
  const { createEntry, saving } = useCreateEntry();
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>New entry</Text>
        {label && <Text style={styles.subtitle}>{label}</Text>}
        <EntryForm
          type={type}
          submitting={saving}
          onSubmit={async (values, medication) => {
            await createEntry(buildCreateInput(id ?? '', regionParamToCode(code ?? ''), type, values, medication));
            router.back();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
