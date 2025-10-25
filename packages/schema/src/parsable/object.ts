import { YasumuSchemaParserError, type YasumuSchemaParser } from "../parser.js";
import type { YasumuSchemaSerializer } from "../serializer.js";
import {
    YasumuSchemaParsable,
    type YasumuSchemaParsableToType,
} from "./parsable.js";
import { YasumuSchemaTokenTypes } from "../tokens.js";
import { YasumuSchemaParsableNullable } from "./nullable.js";

export type _YasumuSchemaParsableObjectExpect = {
    [K: string]: YasumuSchemaParsable<unknown>;
};

export type _YasumuSchemaParsableObjectReturn<
    T extends _YasumuSchemaParsableObjectExpect,
> = {
    [K in keyof T]: YasumuSchemaParsableToType<T[K]>;
};

export class YasumuSchemaParsableObject<
    E extends _YasumuSchemaParsableObjectExpect,
> extends YasumuSchemaParsable<_YasumuSchemaParsableObjectReturn<E>> {
    constructor(public readonly expect: E) {
        super();
    }

    canParse(parser: YasumuSchemaParser) {
        return parser.check(YasumuSchemaTokenTypes.LEFT_CURLY_BRACKET);
    }

    parse(parser: YasumuSchemaParser) {
        const object: Record<string, any> = {};
        const keys = new Set(Object.keys(this.expect));
        parser.consume(YasumuSchemaTokenTypes.LEFT_CURLY_BRACKET);
        while (
            !parser.isEOF() &&
            !parser.check(YasumuSchemaTokenTypes.RIGHT_CURLY_BRACKET)
        ) {
            const [key, value] = this.parseEntry(parser);
            object[key] = value;
            keys.delete(key);
        }
        const end = parser.consume(YasumuSchemaTokenTypes.RIGHT_CURLY_BRACKET);
        for (const x of keys) {
            const nullable =
                this.expect[x] instanceof YasumuSchemaParsableNullable;
            if (!nullable && !(x in object)) {
                const { line, column } = end.span.start;
                throw new YasumuSchemaParserError(
                    `Missing required object key '${x}' (at line ${line}, column ${column})`,
                );
            }
            object[x] ??= null;
        }
        return object as _YasumuSchemaParsableObjectReturn<E>;
    }

    parseEntry(parser: YasumuSchemaParser) {
        const identifier = parser.consume(YasumuSchemaTokenTypes.IDENTIFIER);
        const parsable = this.expect[identifier.value];
        if (!parsable) {
            const { line, column } = identifier.span.start;
            throw new YasumuSchemaParserError(
                `Unexpected block '${identifier.value}' (at line ${line}, column ${column})`,
            );
        }
        parser.consume(YasumuSchemaTokenTypes.COLON);
        const value = parsable.parse(parser);
        return [identifier.value, value] as const;
    }

    canSerialize(_: YasumuSchemaSerializer, value: any) {
        return typeof value === "object";
    }

    serialize(
        serializer: YasumuSchemaSerializer,
        value: _YasumuSchemaParsableObjectReturn<E>,
    ) {
        const keys = Object.keys(this.expect);
        if (keys.length === 0) {
            return "{}";
        }
        let output = "{\n";
        serializer.incrementIndent();
        for (const x of keys) {
            const xSchema = this.expect[x]!;
            const xValue = value[x];
            const nullable = xSchema instanceof YasumuSchemaParsableNullable;
            if (!nullable && (xValue === undefined || xValue === null)) {
                continue;
            }
            serializer.keyPath.push(x);
            output += serializer.indent();
            output += serializer.serializeIdentifier(x) + ": ";
            output += xSchema.serialize(serializer, xValue);
            output += "\n";
            serializer.keyPath.pop();
        }
        serializer.decrementIndent();
        output += serializer.indent() + "}";
        return output;
    }
}
