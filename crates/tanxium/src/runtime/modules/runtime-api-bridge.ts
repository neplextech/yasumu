interface YasumuRuntimeBindings {
  workspace: object;
  runtime: object;
  env: object;
  files: object;
}

type RuntimeGlobal = typeof globalThis & {
  __yasumuRuntimeBindings?: YasumuRuntimeBindings;
};

function getBindings(): YasumuRuntimeBindings {
  const bindings = (globalThis as RuntimeGlobal).__yasumuRuntimeBindings;
  if (!bindings) {
    throw new Error('The Yasumu runtime API is only available during hook execution');
  }
  return bindings;
}

function contextProxy<TKey extends keyof YasumuRuntimeBindings>(key: TKey): YasumuRuntimeBindings[TKey] {
  return new Proxy(
    {},
    {
      get(_target, property) {
        const target = getBindings()[key];
        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set(_target, property, value) {
        return Reflect.set(getBindings()[key], property, value);
      },
      has(_target, property) {
        return property in getBindings()[key];
      },
      ownKeys() {
        return Reflect.ownKeys(getBindings()[key]);
      },
      getOwnPropertyDescriptor(_target, property) {
        const target = getBindings()[key];
        return (
          Object.getOwnPropertyDescriptor(target, property) ?? {
            configurable: true,
            enumerable: true,
            writable: false,
            value: Reflect.get(target, property, target),
          }
        );
      },
    },
  ) as YasumuRuntimeBindings[TKey];
}

export const workspace = contextProxy('workspace');
export const runtime = contextProxy('runtime');
export const env = contextProxy('env');
export const files = contextProxy('files');
