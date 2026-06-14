import { describe, it, expect } from 'vitest';
import { regionParamToCode, codeToRegionParam } from './regionParam';

describe('regionParam', () => {
  it('maps the "general" param to a null region code', () => {
    expect(regionParamToCode('general')).toBeNull();
  });
  it('passes a real region code through unchanged', () => {
    expect(regionParamToCode('knee-right')).toBe('knee-right');
  });
  it('maps a null region code to the "general" param', () => {
    expect(codeToRegionParam(null)).toBe('general');
  });
  it('passes a real region code through to a param unchanged', () => {
    expect(codeToRegionParam('knee-right')).toBe('knee-right');
  });
});
