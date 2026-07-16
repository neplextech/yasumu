import { YasumuSchemaParserError, type YasumuSchemaParser } from '../parser.js';
import { YasumuSchemaSerializer } from '../serializer.js';
import { YasumuSchemaTokenTypes } from '../tokens.js';
import { YasumuSchemaParsable } from './parsable.js';

export type _YasumuSchemaParsableEnumExpect = readonly string[];

export type _YasumuSchemaParsableEnumReturn<E extends _YasumuSchemaParsableEnumExpect> = E extends readonly (infer U)[]
  ? U
  : never;

export class YasumuSchemaParsableEnum<E extends _YasumuSchemaParsableEnumExpect> extends YasumuSchemaParsable<
  _YasumuSchemaParsableEnumReturn<E>
> {
  expect: E;

  constructor(...expect: E) {
    super();
    this.expect = expect;
  }

  override canParse(parser: YasumuSchemaParser) {
    return parser.check(YasumuSchemaTokenTypes.IDENTIFIER);
  }

  parse(parser: YasumuSchemaParser) {
    const identifier = parser.consume(YasumuSchemaTokenTypes.IDENTIFIER);
    if (!this.expect.includes(identifier.value)) {
      throw new YasumuSchemaParserError(`Invalid enum value "${identifier.value}"`, identifier.span);
    }
    return identifier.value as _YasumuSchemaParsableEnumReturn<E>;
  }

  override canSerialize(_: YasumuSchemaSerializer, value: any) {
    return typeof value === 'string';
  }

  serialize(serializer: YasumuSchemaSerializer, value: _YasumuSchemaParsableEnumReturn<E>) {
    return serializer.serializeIdentifier(value);
  }
}
