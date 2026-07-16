import type { YasumuSchemaParser } from '../parser.js';
import type { YasumuSchemaSerializer } from '../serializer.js';
import { YasumuSchemaTokenTypes } from '../tokens.js';
import { YasumuSchemaParsable } from './parsable.js';

export class YasumuSchemaParsableNumber extends YasumuSchemaParsable<number> {
  private constructor() {
    super();
  }

  override canParse(parser: YasumuSchemaParser) {
    return parser.check(YasumuSchemaTokenTypes.NUMBER);
  }

  parse(parser: YasumuSchemaParser) {
    const token = parser.consume(YasumuSchemaTokenTypes.NUMBER);
    return Number(token.value);
  }

  serialize(_: YasumuSchemaSerializer, value: number) {
    return value.toString();
  }

  override canSerialize(_: YasumuSchemaSerializer, value: any) {
    return typeof value === 'number';
  }

  static instance = new YasumuSchemaParsableNumber();
}
