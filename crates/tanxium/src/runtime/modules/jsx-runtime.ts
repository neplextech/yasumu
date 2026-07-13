export function jsx(type: unsafe, props: unsafe, ...children: unsafe[]) {
  return {
    type,
    props,
    children,
  };
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: unsafe;
    }
  }
}

export { jsx as jsxs };
