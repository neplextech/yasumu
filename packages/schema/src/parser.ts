import { YasumuSchemaScanner } from "./scanner.js";
import {
    type YasumuSchemaToken,
    type YasumuSchemaTokenType,
    YasumuSchemaTokenTypes,
} from "./tokens.js";
import type {
    YasumuSchemaParsable,
    YasumuSchemaParsableToType,
} from "./parsable.js";

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
            const { line, column } = this.currentToken!.span.start;
            throw new YasumuSchemaParserError(
                `Expected '${type}' token, received '${this.currentToken.type}' (at line ${line}, column ${column})`,
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
    value: "",
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
    constructor(message: string) {
        super(message);
    }
}

export class YasumuSchemaUnexpectedParserError extends Error {
    constructor() {
        super("This should never be executed");
    }
}
