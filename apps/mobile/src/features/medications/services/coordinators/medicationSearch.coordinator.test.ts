import { describe, it, expect } from 'vitest';
import { makeMedicationSearchCoordinator } from './medicationSearch.coordinator';
import type { MedicationPort } from '../../repositories/medicationCatalog.repository';

function fakePort(over: Partial<MedicationPort> = {}): MedicationPort {
  let rows = 0;
  return {
    count: async () => rows,
    seed: async (r) => { rows = r.length; },
    search: async () => [{ rxcui: '1', name: 'Lisinopril 10 MG Oral Tablet' }],
    loadCatalog: async () => [{ rxcui: '1', name: 'Lisinopril 10 MG Oral Tablet', type: 'generic' }],
    ...over,
  };
}

describe('medication search coordinator', () => {
  it('seeds once when empty, then is a no-op', async () => {
    let loads = 0;
    const port = fakePort({ loadCatalog: async () => { loads++; return [{ rxcui: '1', name: 'A', type: 'generic' }]; } });
    const c = makeMedicationSearchCoordinator(port);
    await c.ensureSeeded();
    await c.ensureSeeded();
    expect(loads).toBe(1);
  });

  it('searches via the port', async () => {
    const c = makeMedicationSearchCoordinator(fakePort());
    const r = await c.search('lisin');
    expect(r.ok && r.data[0].rxcui).toBe('1');
  });

  it('wraps thrown errors as err', async () => {
    const c = makeMedicationSearchCoordinator(fakePort({ search: async () => { throw new Error('boom'); } }));
    expect((await c.search('x')).ok).toBe(false);
  });
});
