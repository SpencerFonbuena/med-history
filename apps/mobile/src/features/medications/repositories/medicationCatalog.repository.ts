import { getDatabase } from '@/lib/db/database';
import type { MedicationSeedRow, MedicationHit } from '@med-history/core';

/** The slice of the catalog the search coordinator drives. */
export interface MedicationPort {
  count(): Promise<number>;
  seed(rows: MedicationSeedRow[]): Promise<void>;
  search(query: string): Promise<MedicationHit[]>;
  loadCatalog(): Promise<MedicationSeedRow[]>;
}

export const medicationCatalogRepository: MedicationPort = {
  async count() {
    return (await getDatabase()).medications.count();
  },
  async seed(rows) {
    return (await getDatabase()).medications.seed(rows);
  },
  async search(query) {
    return (await getDatabase()).medications.search(query);
  },
  async loadCatalog() {
    // Lazy require: the ~4.5MB asset is parsed only when this runs (first-ever seed), never after.
    return require('../../../../assets/data/medications.json') as MedicationSeedRow[];
  },
};
