import type { DbDriver } from '../db/driver';

export function makeRegionsRepository(_driver: DbDriver) {
  return {
    list: async () => {
      throw new Error('todo');
    },
  };
}
