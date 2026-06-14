import type { DbDriver } from '../db/driver';
import type { CoreDeps } from '../db/database';

export function makeSettingsRepository(_driver: DbDriver, _deps: CoreDeps) {
  return {
    get: async () => {
      throw new Error('todo');
    },
  };
}
