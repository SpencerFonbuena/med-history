import type { BodyRegion } from '@med-history/core';
import { ok, err, type Result } from '@/lib/result';
import { buildBodyMap } from '../providers/bodyMap.provider';
import type { BodyMap } from '../../schemas/bodyMap';

/** The slice of core this coordinator drives to assemble the body map. */
export interface BodyMapPort {
  listRegions(): Promise<BodyRegion[]>;
  countsByRegion(profileId: string): Promise<Map<string | null, number>>;
}

export function makeBodyMapCoordinator(port: BodyMapPort) {
  async function loadMap(profileId: string): Promise<Result<BodyMap>> {
    try {
      const [regions, counts] = await Promise.all([
        port.listRegions(),
        port.countsByRegion(profileId),
      ]);
      return ok(buildBodyMap(regions, counts));
    } catch (e) {
      return err((e as Error).message);
    }
  }

  return { loadMap };
}
