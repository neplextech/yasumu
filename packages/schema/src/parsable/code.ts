import { YasumuSchemaTokenTypes } from '../tokens.js';
import type { YasumuSchemaParser } from '../parser.js';
import type { YasumuSchemaSerializer } from '../serializer.js';
import { YasumuSchemaParsable } from './parsable.js';

const LEFT_CURLY_BRACKET = '{';
const RIGHT_CURLY_BRACKET = '}';

export class YasumuSchemaParsableCode extends YasumuSchemaParsable<string> {
  parse(parser: YasumuSchemaParser) {
    parser.ensure(YasumuSchemaTokenTypes.LEFT_CURLY_BRACKET);
    let open = 0;
    let content = '';
    while (!parser.isEOF()) {
      const char = parser.scanner.lexer.peek();
      if (char === LEFT_CURLY_BRACKET) {
        open++;
      }
      if (char === RIGHT_CURLY_BRACKET) {
        if (open === 0) {
          break;
        }
        open--;
      }
      content += parser.scanner.lexer.advance();
    }
    // re-sync parser
    parser.advance();
    parser.consume(YasumuSchemaTokenTypes.RIGHT_CURLY_BRACKET);
    return content;
  }

  serialize(serializer: YasumuSchemaSerializer, value: string) {
    let output = serializer.indent() + '{\n';
    serializer.incrementIndent();
    for (const x of value.trim().split('\n')) {
      output += serializer.indent() + x + '\n';
    }
    serializer.decrementIndent();
    output += serializer.indent() + '}';
    return output;
  }

  static instance = new YasumuSchemaParsableCode();
}
