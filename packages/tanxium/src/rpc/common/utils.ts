export function areDifferentByKeys<T>(a: T, b: T, keys: (keyof T)[]) {
  return keys.some((key) => a[key] !== b[key]);
}

export function assertFound(
  value: unknown,
  message = 'Value not found',
): asserts value {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}
