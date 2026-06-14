import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import {
  appearanceReducer,
  initialAppearance,
  resolveAppearance,
  type AppearanceState,
} from './appearanceReducer';
import type { Appearance, Scheme } from '../schemas/appearance';
import type { SizeLevel } from '@/constants/appearance';
import { useSettings } from '../hooks/useSettings.hook';

interface AppearanceContextValue {
  appearance: Appearance; // resolved (effective + preview)
  setPreview: (p: Partial<Appearance>) => void;
  clearPreview: () => void;
}

const Ctx = createContext<AppearanceContextValue | null>(null);
const DEFAULT: Appearance = { scheme: 'dark', sizeLevel: 1 };

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [state, dispatch] = useReducer(
    appearanceReducer,
    initialAppearance(DEFAULT) as AppearanceState,
  );

  // Sync persisted settings into the reducer's effective appearance.
  useEffect(() => {
    if (settings) {
      dispatch({
        type: 'setEffective',
        effective: { scheme: settings.theme as Scheme, sizeLevel: settings.sizeLevel as SizeLevel },
      });
    }
  }, [settings]);

  const value: AppearanceContextValue = {
    appearance: resolveAppearance(state),
    setPreview: (p) => dispatch({ type: 'setPreview', preview: p }),
    clearPreview: () => dispatch({ type: 'clearPreview' }),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppearance must be used within AppearanceProvider');
  return v;
}
