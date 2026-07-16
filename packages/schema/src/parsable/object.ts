import { YasumuSchemaParserError, type YasumuSchemaParser } from '../parser.js';
import type { YasumuSchemaSerializer } from '../serializer.js';
import { YasumuSchemaTokenTypes } from '../tokens.js';
import { YasumuSchemaParsableNullable } from './nullable.js';
import {
  YasumuSchemaParsableOptional,
  type YasumuSchemaOptionalKeys,
  type YasumuSchemaRequiredKeys,
} from './optional.js';
import { YasumuSchemaParsable, type YasumuSchemaParsableToType } from './parsable.js';

export type _YasumuSchemaParsableObjectExpect = {
  [K: string]: YasumuSchemaParsable<unknown>;
};

export type _YasumuSchemaParsableObjectReturn<T extends _YasumuSchemaParsableObjectExpect> = {
  [K in YasumuSchemaRequiredKeys<T>]: YasumuSchemaParsableToType<T[K]>;
} & {
  [K in YasumuSchemaOptionalKeys<T>]?: YasumuSchemaParsableToType<T[K]>;
};

export class YasumuSchemaParsableObject<E extends _YasumuSchemaParsableObjectExpect> extends YasumuSchemaParsable<
  _YasumuSchemaParsableObjectReturn<E>
> {
  constructor(public readonly expect: E) {
    super();
  }

  override canParse(parser: YasumuSchemaParser) {
    return parser.check(YasumuSchemaTokenTypes.LEFT_CURLY_BRACKET);
  }

  parse(parser: YasumuSchemaParser) {
    const object: Record<string, unknown> = {};
    const keys = new Set(Object.keys(this.expect));
    const parsedKeys = new Set<string>();
    parser.consume(YasumuSchemaTokenTypes.LEFT_CURLY_BRACKET);
    while (!parser.isEOF() && !parser.check(YasumuSchemaTokenTypes.RIGHT_CURLY_BRACKET)) {
      const [key, value] = this.parseEntry(parser, parsedKeys);
      object[key] = value;
      keys.delete(key);
      parsedKeys.add(key);
    }
    const end = parser.consume(YasumuSchemaTokenTypes.RIGHT_CURLY_BRACKET);
    for (const x of keys) {
      const nullable = this.expect[x] instanceof YasumuSchemaParsableNullable;
      const optional = this.expect[x] instanceof YasumuSchemaParsableOptional;
      if (!nullable && !optional && !(x in object)) {
        throw new YasumuSchemaParserError(`Missing required object key '${x}'`, end.span);
      }
      if (nullable) {
        object[x] ??= null;
      }
    }
    return object as _YasumuSchemaParsableObjectReturn<E>;
  }

  parseEntry(parser: YasumuSchemaParser, parsedKeys: ReadonlySet<string> = new Set()) {
    const identifier = parser.consume(YasumuSchemaTokenTypes.IDENTIFIER);
    if (parsedKeys.has(identifier.value)) {
      throw new YasumuSchemaParserError(`Duplicate object key '${identifier.value}'`, identifier.span);
    }
    const parsable = this.expect[identifier.value];
    if (!parsable) {
      throw new YasumuSchemaParserError(`Unexpected block '${identifier.value}'`, identifier.span);
    }
    parser.consume(YasumuSchemaTokenTypes.COLON);
    const value = parsable.parse(parser);
    return [identifier.value, value] as const;
  }

  override canSerialize(_: YasumuSchemaSerializer, value: any) {
    return typeof value === 'object';
  }

  serialize(serializer: YasumuSchemaSerializer, value: _YasumuSchemaParsableObjectReturn<E>) {
    const keys = Object.keys(this.expect) as (keyof E & string)[];
    const object = value as { [K in keyof E]?: YasumuSchemaParsableToType<E[K]> };
    if (keys.length === 0) {
      return '{}';
    }
    let output = '{\n';
    serializer.incrementIndent();
    for (const x of keys) {
      const xSchema = this.expect[x]!;
      const xValue = object[x];
      const nullable = xSchema instanceof YasumuSchemaParsableNullable;
      const optional = xSchema instanceof YasumuSchemaParsableOptional;
      if (optional && xValue === undefined) {
        continue;
      }
      if (!nullable && !optional && (xValue === undefined || xValue === null)) {
        continue;
      }
      serializer.keyPath.push(x);
      output += serializer.indent();
      output += serializer.serializeIdentifier(x) + ': ';
      output += xSchema.serialize(serializer, xValue);
      output += '\n';
      serializer.keyPath.pop();
    }
    serializer.decrementIndent();
    output += serializer.indent() + '}';
    return output;
  }
}
