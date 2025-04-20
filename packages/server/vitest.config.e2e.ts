import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
    env: {
      NODE_ENV: 'test',
      IS_TEST_E2E: 'true',
    },
  },
  plugins: [swc.vite()],
});
