import { YasumuSchemaParserError, type YasumuSchemaParser } from "../parser.js";
import { YasumuSchemaSerializer } from "../serializer.js";
import {
    YasumuSchemaParsable,
    type YasumuSchemaParsableToType,
} from "./parsable.js";

export type _YasumuSchemaParsableUnionExpect =
    readonly YasumuSchemaParsable<unknown>[];

export type _YasumuSchemaParsableUnionReturn<
    E extends _YasumuSchemaParsableUnionExpect,
> = {
    [P in keyof E]: YasumuSchemaParsableToType<E[P]>;
}[number];

export class YasumuSchemaParsableUnion<
    E extends _YasumuSchemaParsableUnionExpect,
> extends YasumuSchemaParsable<_YasumuSchemaParsableUnionReturn<E>> {
    expect: E;

    constructor(...expect: E) {
        super();
        this.expect = expect;
    }

    canParse(parser: YasumuSchemaParser) {
        for (const x of this.expect) {
            if (x.canParse(parser)) {
                return true;
            }
        }
        return false;
    }

    parse(parser: YasumuSchemaParser) {
        for (const x of this.expect) {
            if (x.canParse(parser)) {
                return x.parse(parser) as _YasumuSchemaParsableUnionReturn<E>;
            }
        }
        const { line, column } = parser.currentToken!.span.start;
        throw new YasumuSchemaParserError(
            `No matching parsable parsable in union (at line ${line}, column ${column})`,
        );
    }

    canSerialize(serializer: YasumuSchemaSerializer, value: any) {
        for (const x of this.expect) {
            if (x.canSerialize(serializer, value)) {
                return true;
            }
        }
        return false;
    }

    serialize(
        serializer: YasumuSchemaSerializer,
        value: _YasumuSchemaParsableUnionReturn<E>,
    ) {
        for (const x of this.expect) {
            if (x.canSerialize(serializer, value)) {
                return x.serialize(serializer, value);
            }
        }
        throw new YasumuSchemaParserError(
            "No matching serialiable parsable in union",
        );
    }
}
