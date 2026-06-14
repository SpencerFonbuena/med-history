import type { MedicationHit } from '@med-history/core';

export type { MedicationHit };

/** What the search modal hands back: a catalog product or raw typed text. */
export type MedicationSelection =
  | { kind: 'catalog'; rxcui: string; name: string; strength?: string; doseForm?: string }
  | { kind: 'freeText'; name: string };
