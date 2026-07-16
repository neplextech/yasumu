import { nextJsConfig } from '@yasumu/shared/eslint-config/next';

export default [
  {
    ignores: ['scripts/types/deno/**', 'src-tauri/resources/**', 'src-tauri/target/**'],
  },
  ...nextJsConfig,
];
