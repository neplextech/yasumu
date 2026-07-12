import './ops.d.ts';

declare module 'ext:core/mod.js' {
  export const core: {
    // deno-lint-ignore no-explicit-any
    loadExtScript: (path: string) => any;
  };
}
