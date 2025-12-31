declare module 'yasumu:ui/jsx-runtime' {
  export function jsx(
    type: unsafe,
    props: unsafe,
    ...children: unsafe[]
  ): unsafe;
  export function jsxs(
    type: unsafe,
    props: unsafe,
    ...children: unsafe[]
  ): unsafe;
}

declare module 'yasumu:ui' {}
