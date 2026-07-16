import type { YasumuSchemaParser } from '../parser.js';
import type { YasumuSchemaSerializer } from '../serializer.js';
import { YasumuSchemaParsable, type YasumuSchemaParsableToType } from './parsable.js';

export class YasumuSchemaParsableOptional<E extends YasumuSchemaParsable<unknown>> extends YasumuSchemaParsable<
  YasumuSchemaParsableToType<E> | undefined
> {
  constructor(public readonly expect: E) {
    super();
  }

  override canParse(parser: YasumuSchemaParser) {
    return this.expect.canParse(parser);
  }

  parse(parser: YasumuSchemaParser) {
    return this.expect.parse(parser) as YasumuSchemaParsableToType<E>;
  }

  override canSerialize(serializer: YasumuSchemaSerializer, value: unknown) {
    return value === undefined || this.expect.canSerialize(serializer, value);
  }

  serialize(serializer: YasumuSchemaSerializer, value: YasumuSchemaParsableToType<E> | undefined) {
    if (value === undefined) {
      throw new TypeError('Cannot serialize an absent optional value directly');
    }
    return this.expect.serialize(serializer, value);
  }
}

export type YasumuSchemaOptionalKeys<E extends Record<string, YasumuSchemaParsable<unknown>>> = {
  [K in keyof E]: E[K] extends YasumuSchemaParsableOptional<infer _Inner> ? K : never;
}[keyof E];

export type YasumuSchemaRequiredKeys<E extends Record<string, YasumuSchemaParsable<unknown>>> = Exclude<
  keyof E,
  YasumuSchemaOptionalKeys<E>
>;
