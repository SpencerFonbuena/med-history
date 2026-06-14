import type { CreateEntryInput, UpdateEntryInput, EntryType, Entry } from '@med-history/core';
import type { IconName } from '@/components/icon.component';
import type { EntryFormValues } from '../../schemas/entryForm';
import type { MedicationDetails } from '../../schemas/medicationDetails';

export interface EntryTab {
  type: EntryType;
  label: string;
  /** Singular noun used in the "Add …" call-to-action. */
  singular: string;
  icon: IconName;
  emptyTitle: string;
  emptyMessage: string;
}

export const ENTRY_TABS: EntryTab[] = [
  { type: 'visit', label: 'Visits', singular: 'visit', icon: 'visit', emptyTitle: 'No visits yet', emptyMessage: 'Doctor visits logged for this area will appear here.' },
  { type: 'note', label: 'Notes', singular: 'note', icon: 'note', emptyTitle: 'No notes yet', emptyMessage: 'Jot down symptoms or anything you are noticing over time.' },
  { type: 'prescription', label: 'Prescriptions', singular: 'prescription', icon: 'prescription', emptyTitle: 'No prescriptions yet', emptyMessage: 'Track medications, dosages, and who prescribed them.' },
  { type: 'imaging_test', label: 'Imaging & Tests', singular: 'result', icon: 'imaging_test', emptyTitle: 'No imaging or tests yet', emptyMessage: 'Log lab results and imaging like X-rays and MRIs here.' },
];

/** The tab metadata for a given entry type. */
export function tabFor(type: EntryType): EntryTab {
  return ENTRY_TABS.find((t) => t.type === type)!;
}

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
  if (entry.doctor) meta.push({ label: 'Doctor', value: entry.doctor });
  if (entry.diagnosis) meta.push({ label: 'Diagnosis', value: entry.diagnosis });
  if (entry.prescriber) meta.push({ label: 'Prescriber', value: entry.prescriber });
  if (entry.duration) meta.push({ label: 'Duration', value: entry.duration });
  if (entry.facility) meta.push({ label: 'Facility', value: entry.facility });
  if (entry.subtype) meta.push({ label: 'Type', value: entry.subtype === 'lab' ? 'Lab' : 'Imaging' });
  const strength = entry.details && (entry.details as Record<string, unknown>).strength;
  if (typeof strength === 'string') meta.push({ label: 'Strength', value: strength });
  return meta;
}

function medicationToDetails(med: MedicationDetails): Record<string, unknown> {
  return {
    rxcui: med.rxcui,
    ...(med.strength ? { strength: med.strength } : {}),
    ...(med.doseForm ? { doseForm: med.doseForm } : {}),
  };
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
  medication?: MedicationDetails,
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
    ...(medication ? { details: medicationToDetails(medication) } : {}),
  };
}

export function buildUpdateInput(
  type: EntryType,
  values: EntryFormValues,
  medication?: MedicationDetails,
): UpdateEntryInput {
  return {
    date: values.date,
    title: values.title.trim(),
    body: values.body.trim(),
    ...cleanExtras(values),
    ...(type === 'imaging_test' && values.subtype ? { subtype: values.subtype } : {}),
    ...(medication ? { details: medicationToDetails(medication) } : {}),
  };
}
