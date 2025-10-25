import { YasumuSchemaParserError, type YasumuSchemaParser } from "../parser.js";
import type { YasumuSchemaSerializer } from "../serializer.js";
import {
    YasumuSchemaParsable,
    type YasumuSchemaParsableToType,
} from "./parsable.js";
import { YasumuSchemaTokenTypes } from "../tokens.js";
import { YasumuSchemaParsableNullable } from "./nullable.js";

export type _YasumuSchemaParsableScriptExpect = {
    annotation: string;
    blocks: {
        [K: string]: YasumuSchemaParsable<unknown>;
    };
};

export type _YasumuSchemaParsableScriptReturn<
    T extends _YasumuSchemaParsableScriptExpect,
> = {
    annotation: T["annotation"];
    blocks: {
        [K in keyof T["blocks"]]: YasumuSchemaParsableToType<T["blocks"][K]>;
    };
};

export class YasumuSchemaParsableScript<
    E extends _YasumuSchemaParsableScriptExpect,
> extends YasumuSchemaParsable<_YasumuSchemaParsableScriptReturn<E>> {
    constructor(public readonly expect: E) {
        super();
    }

    parse(parser: YasumuSchemaParser) {
        const blocks: Record<string, unknown> = {};
        const keys = new Set(Object.keys(this.expect.blocks));
        const annotation = this.parseAnnotation(parser);
        while (!parser.isEOF()) {
            const [key, value] = this.parseBlock(parser);
            blocks[key] = value;
            keys.delete(key);
        }
        for (const x of keys) {
            const nullable =
                this.expect.blocks[x]! instanceof YasumuSchemaParsableNullable;
            if (!nullable && !(x in blocks)) {
                throw new YasumuSchemaParserError(
                    `Missing required block '${x}'`,
                );
            }
            blocks[x] ??= null;
        }
        return { annotation, blocks } as _YasumuSchemaParsableScriptReturn<E>;
    }

    parseAnnotation(parser: YasumuSchemaParser) {
        const annotation = parser.consume(YasumuSchemaTokenTypes.ANNOTATION);
        if (annotation.value !== this.expect.annotation) {
            const { line, column } = annotation.span.start;
            throw new YasumuSchemaParserError(
                `Expected '${this.expect.annotation}' annotation, received '${annotation.value}' (at line ${line}, column ${column})`,
            );
        }
        return annotation.value;
    }

    parseBlock(parser: YasumuSchemaParser) {
        const identifier = parser.consume(YasumuSchemaTokenTypes.IDENTIFIER);
        const parsable = this.expect.blocks[identifier.value];
        if (!parsable) {
            const { line, column } = identifier.span.start;
            throw new YasumuSchemaParserError(
                `Unexpected block '${identifier.value}' (at line ${line}, column ${column})`,
            );
        }
        const value = parsable.parse(parser);
        return [identifier.value, value] as const;
    }

    serialize(
        serializer: YasumuSchemaSerializer,
        value: _YasumuSchemaParsableScriptReturn<E>,
    ) {
        let output = `@${value.annotation}\n\n`;
        for (const x of Object.keys(this.expect.blocks)) {
            const xSchema = this.expect.blocks[x]!;
            const xValue = value.blocks[x];
            if (
                xSchema instanceof YasumuSchemaParsableNullable &&
                (xValue === undefined || xValue === null)
            ) {
                continue;
            }
            serializer.keyPath.push(x);
            output += serializer.serializeIdentifier(x) + " ";
            output += xSchema.serialize(serializer, xValue);
            output += "\n\n";
            serializer.keyPath.pop();
        }
        return output;
    }
}
