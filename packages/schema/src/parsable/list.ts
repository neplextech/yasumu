import { type YasumuSchemaParser } from '../parser.js';
import type { YasumuSchemaSerializer } from '../serializer.js';
import {
  YasumuSchemaParsable,
  type YasumuSchemaParsableToType,
} from './parsable.js';
import { YasumuSchemaTokenTypes } from '../tokens.js';

export type _YasumuSchemaParsableListReturn<
  T extends YasumuSchemaParsable<unknown>,
> = YasumuSchemaParsableToType<T>[];

export class YasumuSchemaParsableList<
  E extends YasumuSchemaParsable<unknown>,
> extends YasumuSchemaParsable<_YasumuSchemaParsableListReturn<E>> {
  constructor(public readonly expect: E) {
    super();
  }

  canParse(parser: YasumuSchemaParser) {
    return parser.check(YasumuSchemaTokenTypes.LEFT_SQUARE_BRACKET);
  }

  parse(parser: YasumuSchemaParser) {
    const list: any[] = [];
    parser.consume(YasumuSchemaTokenTypes.LEFT_SQUARE_BRACKET);
    let proceed = true;
    while (
      proceed &&
      !parser.isEOF() &&
      !parser.check(YasumuSchemaTokenTypes.RIGHT_SQUARE_BRACKET)
    ) {
      list.push(this.expect.parse(parser));
      proceed = parser.match(YasumuSchemaTokenTypes.COMMA) !== false;
    }
    parser.consume(YasumuSchemaTokenTypes.RIGHT_SQUARE_BRACKET);
    return list as _YasumuSchemaParsableListReturn<E>;
  }

  canSerialize(_: YasumuSchemaSerializer, value: any) {
    return Array.isArray(value);
  }

  serialize(
    serializer: YasumuSchemaSerializer,
    value: _YasumuSchemaParsableListReturn<E>,
  ) {
    if (value.length === 0) {
      return '[]';
    }
    let output = '[\n';
    serializer.incrementIndent();
    let i = 0;
    for (const x of value) {
      serializer.keyPath.push(`${i}`);
      output += serializer.indent();
      output += this.expect.serialize(serializer, x);
      output += ',\n';
      serializer.keyPath.pop();
    }
    serializer.decrementIndent();
    output += serializer.indent() + ']';
    return output;
  }
}
