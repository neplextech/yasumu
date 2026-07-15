/// <reference types="../../../../apps/yasumu/src-tauri/resources/yasumu-internal.d.ts" />

declare module 'yasumu:ui/jsx-runtime' {
  export function jsx(type: unsafe, props: unsafe, ...children: unsafe[]): unsafe;
  export function jsxs(type: unsafe, props: unsafe, ...children: unsafe[]): unsafe;
}

declare module 'yasumu:ui' {}

declare module 'ext:tanxium_rt_ops/ops.js' {
  export const tanxiumOps: typeof Deno.core.ops;
}
