import type { YasumuSchemaTokenSpanPosition } from './tokens.js';
import { YasumuSchemaUtils } from './utils.js';

export class YasumuSchemaLexer {
  length: number;
  cursor = 0;
  line = 1;
  column = 1;

  constructor(public readonly content: string) {
    this.length = content.length;
  }

  peek() {
    return this.content[this.cursor]!;
  }

  advance() {
    const char = this.content[this.cursor]!;
    this.cursor++;
    this.column++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    }
    return char;
  }

  skipWhitespace() {
    while (!this.isEOF() && YasumuSchemaUtils.isWhitespace(this.peek())) {
      this.advance();
    }
  }

  isEOF() {
    return this.cursor >= this.length;
  }

  getCurrentSpan(): YasumuSchemaTokenSpanPosition {
    return {
      column: this.column,
      line: this.line,
    };
  }
}
