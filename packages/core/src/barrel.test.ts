import { describe, it, expect } from 'vitest';
import { Theme } from './index';

describe('public barrel', () => {
  it('exports the Theme enum', () => {
    expect(Theme.parse('light')).toBe('light');
    expect(() => Theme.parse('x')).toThrow();
  });
});
