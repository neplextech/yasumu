export type Callback<T extends unknown[] = void[], R = void> = (
  ...args: T
) => R;
