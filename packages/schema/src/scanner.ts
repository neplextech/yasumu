import { YasumuSchemaLexer } from './lexer.js';
import {
  type YasumuSchemaToken,
  type YasumuSchemaTokenSpanPosition,
  type YasumuSchemaTokenType,
  YasumuSchemaTokenTypes,
} from './tokens.js';
import { YasumuSchemaUtils } from './utils.js';

export class YasumuSchemaScanner {
  constructor(public readonly lexer: YasumuSchemaLexer) {}

  readToken(): YasumuSchemaToken {
    this.lexer.skipWhitespace();
    const start = this.lexer.getCurrentSpan();
    if (this.lexer.isEOF()) {
      return {
        type: YasumuSchemaTokenTypes.EOF,
        value: '',
        span: {
          start,
          end: start,
        },
      };
    }
    const char = this.lexer.advance();
    if (char in YasumuSchemaScanner.offset1Tokens) {
      return {
        type: YasumuSchemaScanner.offset1Tokens[char]!,
        value: char,
        span: {
          start,
          end: this.lexer.getCurrentSpan(),
        },
      };
    }
    if (char === '@') {
      return this.readAnnotation(start);
    }
    if (char === '"' || char === "'") {
      return this.readString(char, start);
    }
    if (YasumuSchemaUtils.isNumericChar(char)) {
      return this.readNumber(char, start);
    }
    if (YasumuSchemaUtils.isAlphabeticChar(char)) {
      return this.readIdentifier(char, start);
    }
    if (char === '`') {
      return this.readRawIdentifier(start);
    }
    return {
      type: YasumuSchemaTokenTypes.ILLEGAL,
      value: char,
      span: {
        start,
        end: this.lexer.getCurrentSpan(),
      },
    };
  }

  readNumber(
    value: string,
    start: YasumuSchemaTokenSpanPosition,
  ): YasumuSchemaToken {
    while (YasumuSchemaUtils.isNumericChar(this.lexer.peek())) {
      value += this.lexer.advance();
    }
    return {
      type: YasumuSchemaTokenTypes.NUMBER,
      value: value,
      span: {
        start,
        end: this.lexer.getCurrentSpan(),
      },
    };
  }

  readString(
    delimiter: string,
    start: YasumuSchemaTokenSpanPosition,
  ): YasumuSchemaToken {
    let value = '';
    let escaped = false;
    let finished = false;
    while (!this.lexer.isEOF()) {
      const char = this.lexer.advance();
      if (!escaped) {
        if (char === delimiter) {
          finished = true;
          break;
        }
        if (char === '\\') {
          escaped = true;
          continue;
        }
      }
      if (escaped) {
        escaped = false;
        if (char in YasumuSchemaScanner._escapeSequences) {
          value += YasumuSchemaScanner._escapeSequences[char]!;
          continue;
        }
        if (char === 'u' || char === 'x') {
          let code = '';
          const codeLength = char === 'u' ? 4 : 2;
          for (let i = 0; i < codeLength; i++) {
            const char = this.lexer.peek();
            if (!YasumuSchemaUtils.isNumericChar(char)) {
              break;
            }
            code += this.lexer.advance();
          }
          const parsed =
            code.length === codeLength
              ? YasumuSchemaUtils.maybeParseInt(code, 16)
              : undefined;
          if (typeof parsed !== 'number') {
            return {
              type: YasumuSchemaTokenTypes.ILLEGAL,
              value: value,
              span: {
                start,
                end: this.lexer.getCurrentSpan(),
              },
              error: 'Invalid unicode character sequence',
            };
          }
          value += String.fromCodePoint(parsed);
          continue;
        }
        if (char === 'x') {
          let code = '';
          while (!this.lexer.isEOF()) {
            code += this.lexer.advance();
          }
          const parsed =
            code.length === 2
              ? YasumuSchemaUtils.maybeParseInt(code, 16)
              : undefined;
          if (typeof parsed !== 'number') {
            return {
              type: YasumuSchemaTokenTypes.ILLEGAL,
              value: value,
              span: {
                start,
                end: this.lexer.getCurrentSpan(),
              },
              error: 'Invalid unicode character sequence',
            };
          }
          value += String.fromCodePoint(parsed);
          continue;
        }
      }
      value += char;
    }
    if (!finished) {
      return {
        type: YasumuSchemaTokenTypes.ILLEGAL,
        value: value,
        span: {
          start,
          end: this.lexer.getCurrentSpan(),
        },
        error: `Missing end delimiter (${delimiter})`,
      };
    }
    return {
      type: YasumuSchemaTokenTypes.STRING,
      value: value,
      span: {
        start,
        end: this.lexer.getCurrentSpan(),
      },
    };
  }

  readIdentifier(
    value: string,
    start: YasumuSchemaTokenSpanPosition,
  ): YasumuSchemaToken {
    while (YasumuSchemaUtils.isIdentifier(this.lexer.peek())) {
      value += this.lexer.advance();
    }
    return {
      type:
        value in YasumuSchemaScanner._keywords
          ? YasumuSchemaScanner._keywords[value]!
          : YasumuSchemaTokenTypes.IDENTIFIER,
      value: value,
      span: {
        start,
        end: this.lexer.getCurrentSpan(),
      },
    };
  }

  readRawIdentifier(start: YasumuSchemaTokenSpanPosition): YasumuSchemaToken {
    let value = '';
    while (this.lexer.peek() !== '`') {
      value += this.lexer.advance();
    }
    this.lexer.advance();
    return {
      type: YasumuSchemaTokenTypes.IDENTIFIER,
      value: value,
      span: {
        start,
        end: this.lexer.getCurrentSpan(),
      },
    };
  }

  readAnnotation(start: YasumuSchemaTokenSpanPosition): YasumuSchemaToken {
    let value = '';
    while (YasumuSchemaUtils.isIdentifier(this.lexer.peek())) {
      value += this.lexer.advance();
    }
    return {
      type: YasumuSchemaTokenTypes.ANNOTATION,
      value: value,
      span: {
        start,
        end: this.lexer.getCurrentSpan(),
      },
    };
  }

  static offset1Tokens: Record<string, YasumuSchemaTokenType> = {
    '{': YasumuSchemaTokenTypes.LEFT_CURLY_BRACKET,
    '}': YasumuSchemaTokenTypes.RIGHT_CURLY_BRACKET,
    '[': YasumuSchemaTokenTypes.LEFT_SQUARE_BRACKET,
    ']': YasumuSchemaTokenTypes.RIGHT_SQUARE_BRACKET,
    ':': YasumuSchemaTokenTypes.COLON,
    ',': YasumuSchemaTokenTypes.COMMA,
  };

  static _escapeSequences: Record<string, string> = {
    '\\': '\\',
    t: '\t',
    r: '\r',
    n: '\n',
    f: '\f',
    b: '\b',
    v: '\v',
  };

  static _keywords: Record<string, YasumuSchemaTokenType> = {
    true: YasumuSchemaTokenTypes.TRUE,
    false: YasumuSchemaTokenTypes.FALSE,
    null: YasumuSchemaTokenTypes.NULL,
  };
}
