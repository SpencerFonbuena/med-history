import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { EntryType } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { regionParamToCode } from '@/features/body/utils/regionParam';
import { StagedAttachments } from '@/features/attachments/containers/stagedAttachments.container';
import { useCommitStagedAttachments } from '@/features/attachments/hooks/useCommitStagedAttachments.hook';
import type { PendingPick } from '@/features/attachments/schemas/attachment.schema';
import { useCreateEntry } from '../hooks/useCreateEntry.hook';
import { EntryForm } from '../components/entryForm.component';
import { buildCreateInput } from '../services/providers/entryTypes.provider';
import { makeEntryModalStyles } from './entryModal.styles';

export function NewEntryContainer() {
  const theme = useTheme();
  const styles = makeEntryModalStyles(theme);
  const { id, code, type, label } = useLocalSearchParams<{ id: string; code: string; type: EntryType; label?: string }>();
  const { createEntry, saving } = useCreateEntry();
  const { commit } = useCommitStagedAttachments();
  const [picks, setPicks] = useState<PendingPick[]>([]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        enableOnAndroid
        extraScrollHeight={24}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>New entry</Text>
        {label && <Text style={styles.subtitle}>{label}</Text>}
        <EntryForm
          type={type}
          submitting={saving}
          attachmentsSlot={
            type === 'imaging_test' ? <StagedAttachments picks={picks} onChange={setPicks} /> : undefined
          }
          onSubmit={async (values, medication) => {
            const entry = await createEntry(
              buildCreateInput(id ?? '', regionParamToCode(code ?? ''), type, values, medication),
            );
            if (picks.length > 0) {
              const { failures } = await commit(entry.profileId, entry.id, picks);
              if (failures > 0) {
                Alert.alert('Some attachments failed', `${failures} file(s) could not be saved. You can add them again from the entry.`);
              }
            }
            router.back();
          }}
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
