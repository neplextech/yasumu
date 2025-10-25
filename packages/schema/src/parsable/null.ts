import { YasumuSchemaTokenTypes } from '../tokens.js';
import type { YasumuSchemaParser } from '../parser.js';
import type { YasumuSchemaSerializer } from '../serializer.js';
import { YasumuSchemaParsable } from './parsable.js';

export class YasumuSchemaParsableNull extends YasumuSchemaParsable<null> {
  private constructor() {
    super();
  }

  canParse(parser: YasumuSchemaParser) {
    return parser.check(YasumuSchemaTokenTypes.NULL);
  }

  parse(parser: YasumuSchemaParser) {
    parser.consume(YasumuSchemaTokenTypes.NULL);
    return null;
  }

  canSerialize(_: YasumuSchemaSerializer, value: any) {
    return value === undefined || value === null;
  }

  serialize(_: YasumuSchemaSerializer, __: null) {
    return 'null';
  }

  static instance = new YasumuSchemaParsableNull();
}
