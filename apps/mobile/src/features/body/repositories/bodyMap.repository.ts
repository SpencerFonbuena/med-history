import { getDatabase } from '@/lib/db/database';
import type { BodyMapPort } from '../services/coordinators/bodyMap.coordinator';

/** Device-backed body-map port: resolves the singleton DB then delegates to core. */
export const bodyMapRepository: BodyMapPort = {
  async listRegions() {
    return (await getDatabase()).regions.list();
  },
  async countsByRegion(profileId) {
    return (await getDatabase()).entries.countsByRegion(profileId);
  },
};
