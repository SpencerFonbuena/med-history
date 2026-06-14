/** Route-param sentinel for region-less ("General") entries. */
export const GENERAL_PARAM = 'general';

/** Route param -> region code. The 'general' sentinel becomes null (region_code IS NULL). */
export function regionParamToCode(param: string): string | null {
  return param === GENERAL_PARAM ? null : param;
}

/** Region code -> route param. A null code (General) becomes the 'general' sentinel. */
export function codeToRegionParam(code: string | null): string {
  return code === null ? GENERAL_PARAM : code;
}
