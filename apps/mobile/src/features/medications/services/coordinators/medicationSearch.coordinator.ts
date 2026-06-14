import type { MedicationHit } from '@med-history/core';
import { ok, err, type Result } from '@/lib/result';
import type { MedicationPort } from '../../repositories/medicationCatalog.repository';

export function makeMedicationSearchCoordinator(port: MedicationPort) {
  async function ensureSeeded(): Promise<Result<void>> {
    try {
      if ((await port.count()) > 0) return ok(undefined);
      const rows = await port.loadCatalog();
      await port.seed(rows);
      return ok(undefined);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function search(query: string): Promise<Result<MedicationHit[]>> {
    try {
      return ok(await port.search(query));
    } catch (e) {
      return err((e as Error).message);
    }
  }

  return { ensureSeeded, search };
}
