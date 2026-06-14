import { describe, it, expect } from 'vitest';
import { makeEntriesCoordinator, type EntriesPort } from './entries.coordinator';
import type { Entry } from '@med-history/core';

const entry = (over: Partial<Entry>): Entry => ({
  id: 'e', profileId: 'p', regionCode: null, type: 'visit', subtype: null,
  date: '2026-01-01', title: 'T', body: 'B', doctor: null, diagnosis: null,
  prescriber: null, duration: null, facility: null, details: null,
  createdAt: 't', updatedAt: 't', ...over,
});

function fakePort(over: Partial<EntriesPort> = {}): EntriesPort {
  return {
    listByRegion: async (_p, code) => [entry({ id: 'region', regionCode: code })],
    listGeneral: async () => [entry({ id: 'general' })],
    get: async (id) => entry({ id }),
    create: async () => entry({}),
    update: async (id) => entry({ id }),
    remove: async () => {},
    ...over,
  };
}

describe('entries coordinator', () => {
  it('routes a real code to listByRegion', async () => {
    const c = makeEntriesCoordinator(fakePort());
    const r = await c.list('p', 'knee-right', 'visit');
    expect(r.ok && r.data[0].id).toBe('region');
  });
  it('routes a null code to listGeneral', async () => {
    const c = makeEntriesCoordinator(fakePort());
    const r = await c.list('p', null, 'visit');
    expect(r.ok && r.data[0].id).toBe('general');
  });
  it('returns err when get finds nothing', async () => {
    const c = makeEntriesCoordinator(fakePort({ get: async () => undefined }));
    expect((await c.get('x')).ok).toBe(false);
  });
  it('wraps thrown errors as err', async () => {
    const c = makeEntriesCoordinator(fakePort({ listGeneral: async () => { throw new Error('db down'); } }));
    const r = await c.list('p', null, 'visit');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('db down');
  });
});
