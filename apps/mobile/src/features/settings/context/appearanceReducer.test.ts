import { describe, it, expect } from 'vitest';
import { appearanceReducer, resolveAppearance, initialAppearance } from './appearanceReducer';

describe('appearance reducer', () => {
  it('resolves effective when no preview', () => {
    const s = initialAppearance({ scheme: 'dark', sizeLevel: 2 });
    expect(resolveAppearance(s)).toEqual({ scheme: 'dark', sizeLevel: 2 });
  });

  it('preview overrides effective, then clears', () => {
    let s = initialAppearance({ scheme: 'dark', sizeLevel: 1 });
    s = appearanceReducer(s, { type: 'setPreview', preview: { sizeLevel: 5 } });
    expect(resolveAppearance(s)).toEqual({ scheme: 'dark', sizeLevel: 5 });
    s = appearanceReducer(s, { type: 'setPreview', preview: { scheme: 'light' } });
    expect(resolveAppearance(s)).toEqual({ scheme: 'light', sizeLevel: 5 });
    s = appearanceReducer(s, { type: 'clearPreview' });
    expect(resolveAppearance(s)).toEqual({ scheme: 'dark', sizeLevel: 1 });
  });

  it('setEffective replaces persisted values', () => {
    let s = initialAppearance({ scheme: 'dark', sizeLevel: 1 });
    s = appearanceReducer(s, { type: 'setEffective', effective: { scheme: 'light', sizeLevel: 3 } });
    expect(resolveAppearance(s)).toEqual({ scheme: 'light', sizeLevel: 3 });
  });
});
