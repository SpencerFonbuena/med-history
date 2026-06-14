/** A placed region marker with its display label and lit state. */
export interface Dot {
  code: string;
  label: string;
  cx: number;
  cy: number;
  lit: boolean;
}

/** The full body-map view model for one profile. */
export interface BodyMap {
  front: Dot[];
  back: Dot[];
  generalCount: number;
}
