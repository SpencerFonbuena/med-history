import type { DbDriver } from '../db/driver';
import type { CoreDeps } from '../db/database';

export function makeProfilesRepository(_driver: DbDriver, _deps: CoreDeps) {
  return {
    create: async () => {
      throw new Error('todo');
    },
  };
}
