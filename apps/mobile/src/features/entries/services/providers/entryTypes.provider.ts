import type { CreateEntryInput, UpdateEntryInput, EntryType, Entry } from '@med-history/core';
import type { EntryFormValues } from '../../schemas/entryForm';

export interface EntryTab {
  type: EntryType;
  label: string;
  emptyIcon: string;
  emptyMessage: string;
}

export const ENTRY_TABS: EntryTab[] = [
  { type: 'visit', label: 'Visits', emptyIcon: '🩺', emptyMessage: 'No doctor visits logged for this area.' },
  { type: 'note', label: 'Notes', emptyIcon: '📝', emptyMessage: 'No notes yet. Add what you are noticing.' },
  { type: 'prescription', label: 'Prescriptions', emptyIcon: '💊', emptyMessage: 'No prescriptions recorded.' },
  { type: 'imaging_test', label: 'Imaging & Tests', emptyIcon: '🩻', emptyMessage: 'No imaging or tests logged.' },
];

type ExtraKey = 'doctor' | 'diagnosis' | 'prescriber' | 'duration' | 'facility';

const EXTRAS: Record<EntryType, ExtraKey[]> = {
  visit: ['doctor', 'diagnosis'],
  note: [],
  prescription: ['prescriber', 'duration'],
  imaging_test: ['facility'],
};

export function extrasFor(type: EntryType): ExtraKey[] {
  return EXTRAS[type];
}

export interface MetaItem {
  label: string;
  value: string;
}

/** Type-specific fields present on the entry, formatted for the card. */
export function entryMeta(entry: Entry): MetaItem[] {
  const meta: MetaItem[] = [];
  if (entry.doctor) meta.push({ label: 'Dr.', value: entry.doctor });
  if (entry.diagnosis) meta.push({ label: 'Dx:', value: entry.diagnosis });
  if (entry.prescriber) meta.push({ label: 'Rx by:', value: entry.prescriber });
  if (entry.duration) meta.push({ label: 'Duration:', value: entry.duration });
  if (entry.facility) meta.push({ label: 'At:', value: entry.facility });
  if (entry.subtype) meta.push({ label: 'Type:', value: entry.subtype === 'lab' ? 'Lab' : 'Imaging' });
  return meta;
}

function cleanExtras(values: EntryFormValues): Partial<Record<ExtraKey, string>> {
  const out: Partial<Record<ExtraKey, string>> = {};
  for (const key of ['doctor', 'diagnosis', 'prescriber', 'duration', 'facility'] as const) {
    const v = values[key]?.trim();
    if (v) out[key] = v;
  }
  return out;
}

export function buildCreateInput(
  profileId: string,
  regionCode: string | null,
  type: EntryType,
  values: EntryFormValues,
): CreateEntryInput {
  return {
    profileId,
    regionCode,
    type,
    date: values.date,
    title: values.title.trim(),
    body: values.body.trim(),
    ...cleanExtras(values),
    ...(type === 'imaging_test' && values.subtype ? { subtype: values.subtype } : {}),
  };
}

export function buildUpdateInput(type: EntryType, values: EntryFormValues): UpdateEntryInput {
  return {
    date: values.date,
    title: values.title.trim(),
    body: values.body.trim(),
    ...cleanExtras(values),
    ...(type === 'imaging_test' && values.subtype ? { subtype: values.subtype } : {}),
  };
}
