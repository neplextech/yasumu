import { type YasumuSchemaParser } from '../parser.js';
import type { YasumuSchemaSerializer } from '../serializer.js';
import {
  YasumuSchemaParsable,
  type YasumuSchemaParsableToType,
} from './parsable.js';
import { YasumuSchemaTokenTypes } from '../tokens.js';

export type _YasumuSchemaParsableRecordReturn<
  T extends YasumuSchemaParsable<unknown>,
> = {
  [K: string]: YasumuSchemaParsableToType<T>;
};

export class YasumuSchemaParsableRecord<
  E extends YasumuSchemaParsable<unknown>,
> extends YasumuSchemaParsable<_YasumuSchemaParsableRecordReturn<E>> {
  constructor(public readonly expect: E) {
    super();
  }

  canParse(parser: YasumuSchemaParser) {
    return parser.check(YasumuSchemaTokenTypes.LEFT_CURLY_BRACKET);
  }

  parse(parser: YasumuSchemaParser) {
    const object: Record<string, any> = {};
    const keys = new Set(Object.keys(this.expect));
    parser.consume(YasumuSchemaTokenTypes.LEFT_CURLY_BRACKET);
    while (
      !parser.isEOF() &&
      !parser.check(YasumuSchemaTokenTypes.RIGHT_CURLY_BRACKET)
    ) {
      const identifier = parser.consume(YasumuSchemaTokenTypes.IDENTIFIER);
      parser.consume(YasumuSchemaTokenTypes.COLON);
      const value = this.expect.parse(parser);
      object[identifier.value] = value;
      keys.delete(identifier.value);
    }
    parser.consume(YasumuSchemaTokenTypes.RIGHT_CURLY_BRACKET);
    return object as _YasumuSchemaParsableRecordReturn<E>;
  }

  canSerialize(_: YasumuSchemaSerializer, value: any) {
    return typeof value === 'object';
  }

  serialize(
    serializer: YasumuSchemaSerializer,
    value: _YasumuSchemaParsableRecordReturn<E>,
  ) {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return '{}';
    }
    let output = '{\n';
    serializer.incrementIndent();
    for (const x of keys) {
      serializer.keyPath.push(x);
      output += serializer.indent();
      output += serializer.serializeIdentifier(x) + ': ';
      output += this.expect.serialize(serializer, value[x]!);
      output += '\n';
      serializer.keyPath.pop();
    }
    serializer.decrementIndent();
    output += serializer.indent() + '}';
    return output;
  }
}
