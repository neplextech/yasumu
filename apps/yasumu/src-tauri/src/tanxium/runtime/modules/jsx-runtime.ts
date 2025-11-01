export function jsx(type: unsafe, props: unsafe, ...children: unsafe[]) {
  return {
    type,
    props,
    children,
  };
}

export { jsx as jsxs };
