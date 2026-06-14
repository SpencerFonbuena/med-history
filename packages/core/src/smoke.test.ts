import { describe, it, expect } from 'vitest';
import { CORE_READY } from './index';

describe('core package', () => {
  it('loads', () => {
    expect(CORE_READY).toBe(true);
  });
});
