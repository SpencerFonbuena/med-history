import { describe, it, expect } from 'vitest';
import { ENTRY_TABS, extrasFor, entryMeta, buildCreateInput, buildUpdateInput } from './entryTypes.provider';
import type { Entry } from '@med-history/core';

describe('entryTypes provider', () => {
  it('lists four tabs in order', () => {
    expect(ENTRY_TABS.map((t) => t.type)).toEqual(['visit', 'note', 'prescription', 'imaging_test']);
  });
  it('exposes extras per type', () => {
    expect(extrasFor('visit')).toEqual(['doctor', 'diagnosis']);
    expect(extrasFor('note')).toEqual([]);
    expect(extrasFor('prescription')).toEqual(['prescriber', 'duration']);
    expect(extrasFor('imaging_test')).toEqual(['facility']);
  });
  it('builds meta only from present fields', () => {
    const e = { doctor: 'Park', diagnosis: null, subtype: 'lab' } as unknown as Entry;
    const meta = entryMeta(e);
    expect(meta).toContainEqual({ label: 'Doctor', value: 'Park' });
    expect(meta).toContainEqual({ label: 'Type', value: 'Lab' });
    expect(meta.find((m) => m.label === 'Diagnosis')).toBeUndefined();
  });
  it('attaches subtype only on imaging_test and drops empty optionals', () => {
    const values = { date: '2026-01-01', title: 'T', body: 'B', doctor: '  ', diagnosis: 'Dx', subtype: 'lab' } as const;
    const visit = buildCreateInput('p', 'knee-right', 'visit', values);
    expect(visit.subtype).toBeUndefined();
    expect(visit.doctor).toBeUndefined();
    expect(visit.diagnosis).toBe('Dx');
    expect(visit.regionCode).toBe('knee-right');
    const img = buildCreateInput('p', null, 'imaging_test', values);
    expect(img.subtype).toBe('lab');
    expect(img.regionCode).toBeNull();
  });
  it('buildUpdateInput omits profileId/region and keeps edited fields', () => {
    const u = buildUpdateInput('prescription', { date: '2026-01-01', title: 'T', body: 'B', prescriber: 'Park', duration: '10 days' });
    expect(u.title).toBe('T');
    expect(u.prescriber).toBe('Park');
    expect('profileId' in u).toBe(false);
    expect('regionCode' in u).toBe(false);
  });
  it('attaches medication details to a create input', () => {
    const r = buildCreateInput(
      'p', null, 'prescription',
      { date: '2026-01-01', title: 'Lisinopril 10 MG Oral Tablet', body: 'x' },
      { rxcui: '12345', strength: '10 MG', doseForm: 'Oral Tablet' },
    );
    expect(r.details).toEqual({ rxcui: '12345', strength: '10 MG', doseForm: 'Oral Tablet' });
  });
  it('omits details when no medication is given', () => {
    const r = buildCreateInput('p', null, 'prescription', { date: '2026-01-01', title: 'x', body: 'y' });
    expect(r.details).toBeUndefined();
  });
  it('attaches medication details on update too', () => {
    const u = buildUpdateInput('prescription', { date: '2026-01-01', title: 'T', body: 'B' }, { rxcui: '9' });
    expect(u.details).toEqual({ rxcui: '9' });
  });
  it('entryMeta surfaces the strength from details', () => {
    const e = { details: { rxcui: '1', strength: '10 MG' } } as unknown as import('@med-history/core').Entry;
    expect(entryMeta(e)).toContainEqual({ label: 'Strength', value: '10 MG' });
  });
});
