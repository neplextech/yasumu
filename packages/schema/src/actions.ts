import { YasumuSchemaLexer } from './lexer.js';
import type {
  AnyYasumuSchema,
  YasumuSchemaParsableToType,
} from './parsable.js';
import { YasumuSchemaParser } from './parser.js';
import { YasumuSchemaScanner } from './scanner.js';
import { YasumuSchemaSerializer } from './serializer.js';

export class YasumuSchemaActions<T extends AnyYasumuSchema> {
  constructor(public readonly expect: T) {}

  parse(content: string) {
    const lexer = new YasumuSchemaLexer(content);
    const scanner = new YasumuSchemaScanner(lexer);
    const parser = new YasumuSchemaParser(scanner);
    return parser.parse(this.expect);
  }

  serialize(value: YasumuSchemaParsableToType<T>) {
    const serializer = new YasumuSchemaSerializer();
    return serializer.serialize(this.expect, value);
  }
}

export function deserialize<T extends AnyYasumuSchema>(
  content: string,
  expect: T,
) {
  const lexer = new YasumuSchemaLexer(content);
  const scanner = new YasumuSchemaScanner(lexer);
  const parser = new YasumuSchemaParser(scanner);
  return parser.parse(expect);
}

export function serialize<T extends AnyYasumuSchema>(
  value: YasumuSchemaParsableToType<T>,
  expect: T,
) {
  const serializer = new YasumuSchemaSerializer();
  return serializer.serialize(expect, value);
}
