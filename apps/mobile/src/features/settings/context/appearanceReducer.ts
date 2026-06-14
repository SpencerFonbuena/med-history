import type { Appearance } from '../schemas/appearance';

export interface AppearanceState {
  effective: Appearance;
  preview: Partial<Appearance> | null;
}

export type AppearanceAction =
  | { type: 'setEffective'; effective: Appearance }
  | { type: 'setPreview'; preview: Partial<Appearance> }
  | { type: 'clearPreview' };

export const initialAppearance = (effective: Appearance): AppearanceState => ({
  effective,
  preview: null,
});

export function appearanceReducer(state: AppearanceState, action: AppearanceAction): AppearanceState {
  switch (action.type) {
    case 'setEffective':
      return { ...state, effective: action.effective };
    case 'setPreview':
      return { ...state, preview: { ...state.preview, ...action.preview } };
    case 'clearPreview':
      return { ...state, preview: null };
  }
}

/** The appearance actually shown = effective with any preview applied on top. */
export function resolveAppearance(state: AppearanceState): Appearance {
  return { ...state.effective, ...(state.preview ?? {}) };
}
