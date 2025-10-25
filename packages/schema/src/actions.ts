import { YasumuSchemaLexer } from './lexer.js';
import type {
  YasumuSchemaParsable,
  YasumuSchemaParsableToType,
} from './parsable.js';
import { YasumuSchemaParser } from './parser.js';
import { YasumuSchemaScanner } from './scanner.js';
import { YasumuSchemaSerializer } from './serializer.js';

export class YasumuSchemaActions<T extends YasumuSchemaParsable<unknown>> {
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
