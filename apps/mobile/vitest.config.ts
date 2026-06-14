import { defineConfig } from 'vitest/config';

// Pure-logic tests only (node env). RN/Expo component files are NOT tested here.
export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'], exclude: ['**/node_modules/**'] },
});
