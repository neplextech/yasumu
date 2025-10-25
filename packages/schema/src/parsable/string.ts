import { YasumuSchemaTokenTypes } from '../tokens.js';
import type { YasumuSchemaParser } from '../parser.js';
import type { YasumuSchemaSerializer } from '../serializer.js';
import { YasumuSchemaParsable } from './parsable.js';

export class YasumuSchemaParsableString extends YasumuSchemaParsable<string> {
  private constructor() {
    super();
  }

  canParse(parser: YasumuSchemaParser) {
    return parser.check(YasumuSchemaTokenTypes.STRING);
  }

  parse(parser: YasumuSchemaParser) {
    const token = parser.consume(YasumuSchemaTokenTypes.STRING);
    return token.value;
  }

  canSerialize(_: YasumuSchemaSerializer, value: any) {
    return typeof value === 'string';
  }

  serialize(_: YasumuSchemaSerializer, value: string) {
    return JSON.stringify(value);
  }

  static instance = new YasumuSchemaParsableString();
}
