import type { YasumuSchemaParsable, YasumuSchemaParsableToType } from './parsable.js';
import { YasumuSchemaScanner } from './scanner.js';
import {
  type YasumuSchemaToken,
  type YasumuSchemaTokenSpan,
  type YasumuSchemaTokenType,
  YasumuSchemaTokenTypes,
} from './tokens.js';

export class YasumuSchemaParser {
  currentToken = DUMMY_TOKEN;

  constructor(public readonly scanner: YasumuSchemaScanner) {
    this.advance();
  }

  parse<T extends YasumuSchemaParsable<unknown>>(parsable: T) {
    return parsable.parse(this) as YasumuSchemaParsableToType<T>;
  }

  advance() {
    const previousToken = this.currentToken;
    this.currentToken = this.scanner.readToken();
    return previousToken;
  }

  check(type: YasumuSchemaTokenType) {
    return this.currentToken.type === type;
  }

  match(type: YasumuSchemaTokenType) {
    if (this.currentToken.type !== type) {
      return false;
    }
    return this.advance();
  }

  ensure(type: YasumuSchemaTokenType) {
    if (this.currentToken.type !== type) {
      const scannerError = this.currentToken.error ? `: ${this.currentToken.error}` : '';
      throw new YasumuSchemaParserError(
        `Expected '${type}' token, received '${this.currentToken.type}'${scannerError}`,
        this.currentToken.span,
      );
    }
  }

  consume(type: YasumuSchemaTokenType) {
    this.ensure(type);
    return this.advance();
  }

  isEOF() {
    return this.currentToken.type === YasumuSchemaTokenTypes.EOF;
  }
}

const DUMMY_TOKEN: YasumuSchemaToken = {
  type: YasumuSchemaTokenTypes.EOF,
  value: '',
  span: {
    start: {
      line: -1,
      column: -1,
    },
    end: {
      line: -1,
      column: -1,
    },
  },
};

export class YasumuSchemaParserError extends Error {
  override readonly name = 'YasumuSchemaParserError';

  constructor(
    message: string,
    public readonly span?: YasumuSchemaTokenSpan,
  ) {
    const location = span ? ` (at line ${span.start.line}, column ${span.start.column})` : '';
    super(`${message}${location}`);
  }
}

export class YasumuSchemaUnexpectedParserError extends Error {
  constructor() {
    super('This should never be executed');
  }
}
