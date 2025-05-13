import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      include: [
        'server/**/*.ts',
        'client/src/**/*.tsx',
        'client/src/**/*.ts',
        'shared/**/*.ts',
      ],
      exclude: [
        'client/src/main.tsx',
        'client/src/components/ui/**',
        'server/vite.ts',
        'server/index.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__tests__/**',
      ],
    },
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});