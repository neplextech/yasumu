export function areDifferentByKeys<T>(a: T, b: T, keys: (keyof T)[]) {
  return keys.some((key) => a[key] !== b[key]);
}
