import type { DbDriver } from '../db/driver';
import type { CoreDeps } from '../db/database';

export function makeEntriesRepository(_driver: DbDriver, _deps: CoreDeps) {
  return {
    create: async () => {
      throw new Error('todo');
    },
  };
}
