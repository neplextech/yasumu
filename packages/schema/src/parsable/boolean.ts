import { YasumuSchemaTokenTypes } from "../tokens.js";
import { YasumuSchemaParserError, type YasumuSchemaParser } from "../parser.js";
import type { YasumuSchemaSerializer } from "../serializer.js";
import { YasumuSchemaParsable } from "./parsable.js";

export class YasumuSchemaParsableBoolean extends YasumuSchemaParsable<boolean> {
    private constructor() {
        super();
    }

    canParse(parser: YasumuSchemaParser) {
        return (
            parser.check(YasumuSchemaTokenTypes.TRUE) ||
            parser.check(YasumuSchemaTokenTypes.FALSE)
        );
    }

    parse(parser: YasumuSchemaParser) {
        if (parser.match(YasumuSchemaTokenTypes.TRUE)) {
            return true;
        }
        if (parser.match(YasumuSchemaTokenTypes.FALSE)) {
            return false;
        }
        const { type, span } = parser.currentToken!;
        const { line, column } = span.start;
        throw new YasumuSchemaParserError(
            `Expected '${YasumuSchemaTokenTypes.TRUE}' or '${YasumuSchemaTokenTypes.FALSE}', received '${type}' (at line ${line}, column ${column})`,
        );
    }

    canSerialize(_: YasumuSchemaSerializer, value: any) {
        return typeof value === "boolean";
    }

    serialize(_: YasumuSchemaSerializer, value: boolean) {
        return value.toString();
    }

    static instance = new YasumuSchemaParsableBoolean();
}
