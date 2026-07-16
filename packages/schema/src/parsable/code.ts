import type { YasumuSchemaParser } from '../parser.js';
import type { YasumuSchemaSerializer } from '../serializer.js';
import { YasumuSchemaTokenTypes } from '../tokens.js';
import { YasumuSchemaParsable } from './parsable.js';

const LEFT_CURLY_BRACKET = '{';
const RIGHT_CURLY_BRACKET = '}';

export class YasumuSchemaParsableCode extends YasumuSchemaParsable<string> {
  parse(parser: YasumuSchemaParser) {
    parser.ensure(YasumuSchemaTokenTypes.LEFT_CURLY_BRACKET);
    let depth = 0;
    let content = '';
    let mode: 'code' | 'single-quote' | 'double-quote' | 'template' | 'line-comment' | 'block-comment' | 'regex' =
      'code';
    let escaped = false;
    let regexCharacterClass = false;
    const templateExpressionDepths: number[] = [];

    while (!parser.scanner.lexer.isEOF()) {
      const char = parser.scanner.lexer.peek();
      const next = parser.scanner.lexer.peek(1);

      if (mode === 'line-comment') {
        content += parser.scanner.lexer.advance();
        if (char === '\n') {
          mode = 'code';
        }
        continue;
      }

      if (mode === 'block-comment') {
        content += parser.scanner.lexer.advance();
        if (char === '*' && next === '/') {
          content += parser.scanner.lexer.advance();
          mode = 'code';
        }
        continue;
      }

      if (mode === 'single-quote' || mode === 'double-quote') {
        content += parser.scanner.lexer.advance();
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if ((mode === 'single-quote' && char === "'") || (mode === 'double-quote' && char === '"')) {
          mode = 'code';
        }
        continue;
      }

      if (mode === 'regex') {
        content += parser.scanner.lexer.advance();
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '[') {
          regexCharacterClass = true;
        } else if (char === ']') {
          regexCharacterClass = false;
        } else if (char === '/' && !regexCharacterClass) {
          mode = 'code';
        } else if (char === '\n') {
          mode = 'code';
        }
        continue;
      }

      if (mode === 'template') {
        content += parser.scanner.lexer.advance();
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '`') {
          mode = 'code';
        } else if (char === '$' && next === LEFT_CURLY_BRACKET) {
          content += parser.scanner.lexer.advance();
          depth++;
          templateExpressionDepths.push(depth);
          mode = 'code';
        }
        continue;
      }

      if (char === '/' && next === '/') {
        content += parser.scanner.lexer.advance();
        content += parser.scanner.lexer.advance();
        mode = 'line-comment';
        continue;
      }
      if (char === '/' && next === '*') {
        content += parser.scanner.lexer.advance();
        content += parser.scanner.lexer.advance();
        mode = 'block-comment';
        continue;
      }
      if (char === "'") {
        content += parser.scanner.lexer.advance();
        mode = 'single-quote';
        continue;
      }
      if (char === '"') {
        content += parser.scanner.lexer.advance();
        mode = 'double-quote';
        continue;
      }
      if (char === '`') {
        content += parser.scanner.lexer.advance();
        mode = 'template';
        continue;
      }
      if (char === '/' && this.canStartRegex(content)) {
        content += parser.scanner.lexer.advance();
        regexCharacterClass = false;
        mode = 'regex';
        continue;
      }
      if (char === LEFT_CURLY_BRACKET) {
        depth++;
        content += parser.scanner.lexer.advance();
        continue;
      }
      if (char === RIGHT_CURLY_BRACKET) {
        if (depth === 0) {
          break;
        }
        content += parser.scanner.lexer.advance();
        if (templateExpressionDepths[templateExpressionDepths.length - 1] === depth) {
          templateExpressionDepths.pop();
          mode = 'template';
        }
        depth--;
        continue;
      }
      content += parser.scanner.lexer.advance();
    }
    // re-sync parser
    parser.advance();
    parser.consume(YasumuSchemaTokenTypes.RIGHT_CURLY_BRACKET);
    return content;
  }

  private canStartRegex(content: string): boolean {
    const trimmed = content.trimEnd();
    const previous = trimmed[trimmed.length - 1];
    if (previous === undefined || '([{:;,=!?&|+-*%^~<>'.includes(previous)) {
      return true;
    }
    const previousWord = /([A-Za-z_$][\w$]*)$/.exec(trimmed)?.[1];
    return previousWord !== undefined && REGEX_PREFIX_KEYWORDS.has(previousWord);
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

const REGEX_PREFIX_KEYWORDS = new Set([
  'await',
  'case',
  'delete',
  'in',
  'instanceof',
  'of',
  'return',
  'throw',
  'typeof',
  'void',
  'yield',
]);
