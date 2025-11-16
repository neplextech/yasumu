type JSONPrimitives = string | number | boolean | null;
export type JSONValue =
  | { [key: string]: JSONPrimitives | JSONValue }
  | JSONValue[];

export interface KeyValuePair<V = string> {
  key: string;
  value: V;
  enabled: boolean;
}

export type MaybePromise<T> = T | Promise<T>;
