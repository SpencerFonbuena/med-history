import { describe, it, expect } from 'vitest';
import { buildFtsQuery } from './ftsQuery';

describe('buildFtsQuery', () => {
  it('lowercases and prefixes each token, AND-ed', () => {
    expect(buildFtsQuery('Lisin 10')).toBe('lisin* 10*');
  });
  it('splits on punctuation as well as spaces', () => {
    expect(buildFtsQuery('amox/clav')).toBe('amox* clav*');
  });
  it('returns empty string for blank input', () => {
    expect(buildFtsQuery('   ')).toBe('');
  });
});
