import { describe, it, expect } from 'vitest';
import { makeProfilesCoordinator, type ProfilesPort } from './profiles.coordinator';
import type { Profile } from '@med-history/core';

function fakePort(over: Partial<ProfilesPort> = {}): ProfilesPort {
  const rows: Profile[] = [];
  let seq = 0;
  return {
    list: async () => rows,
    create: async (input) => {
      const p: Profile = { id: `p${++seq}`, ...input, createdAt: 't', updatedAt: 't' };
      rows.push(p);
      return p;
    },
    remove: async (id) => {
      const i = rows.findIndex((r) => r.id === id);
      if (i >= 0) rows.splice(i, 1);
    },
    ...over,
  };
}

describe('profiles coordinator', () => {
  it('creates then lists', async () => {
    const c = makeProfilesCoordinator(fakePort());
    const created = await c.create({ name: 'A', dob: '1990-01-01', sex: 'male' });
    expect(created.ok).toBe(true);
    const all = await c.loadAll();
    expect(all.ok && all.data).toHaveLength(1);
  });

  it('removes', async () => {
    const port = fakePort();
    const c = makeProfilesCoordinator(port);
    const created = await c.create({ name: 'A', dob: '1990-01-01', sex: 'male' });
    const id = created.ok ? created.data.id : '';
    await c.remove(id);
    expect((await port.list())).toHaveLength(0);
  });

  it('wraps thrown errors as err', async () => {
    const c = makeProfilesCoordinator(fakePort({ list: async () => { throw new Error('db down'); } }));
    const r = await c.loadAll();
    expect(r.ok).toBe(false);
  });
});
