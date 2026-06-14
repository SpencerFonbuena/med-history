import type { DbDriver } from '../db/driver';
import type { RegionSide, RegionZone } from '../schemas/enums';

export interface BodyRegion {
  code: string;
  label: string;
  zone: RegionZone;
  side: RegionSide | null;
}

interface RegionRow {
  code: string;
  label: string;
  zone: string;
  side: string | null;
}

const toRegion = (r: RegionRow): BodyRegion => ({
  code: r.code,
  label: r.label,
  zone: r.zone as RegionZone,
  side: (r.side as RegionSide | null) ?? null,
});

export function makeRegionsRepository(driver: DbDriver) {
  async function list(): Promise<BodyRegion[]> {
    const rows = await driver.all<RegionRow>('SELECT * FROM body_regions ORDER BY code ASC');
    return rows.map(toRegion);
  }

  async function listByZone(zone: RegionZone): Promise<BodyRegion[]> {
    const rows = await driver.all<RegionRow>('SELECT * FROM body_regions WHERE zone = ? ORDER BY code ASC', [zone]);
    return rows.map(toRegion);
  }

  return { list, listByZone };
}
