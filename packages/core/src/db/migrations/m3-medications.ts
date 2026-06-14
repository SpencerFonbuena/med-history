import type { Migration } from '../migrate';

export const m3Medications: Migration = {
  version: 3,
  up: async (d) => {
    await d.exec(
      `CREATE VIRTUAL TABLE medications USING fts5(
        name, rxcui UNINDEXED, type UNINDEXED, brand UNINDEXED,
        strength UNINDEXED, doseForm UNINDEXED, tokenize='porter unicode61'
      )`,
    );
  },
};
