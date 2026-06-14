import { defineConfig } from 'vitest/config';
import path from 'path';

// Pure-logic tests only (node env). RN/Expo component files are NOT tested here.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'], exclude: ['**/node_modules/**'] },
});
