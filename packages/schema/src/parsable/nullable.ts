import { YasumuSchemaTokenTypes } from "../tokens.js";
import type { YasumuSchemaParser } from "../parser.js";
import type { YasumuSchemaSerializer } from "../serializer.js";
import {
    YasumuSchemaParsable,
    type YasumuSchemaParsableToType,
} from "./parsable.js";

export class YasumuSchemaParsableNullable<
    E extends YasumuSchemaParsable<unknown>,
> extends YasumuSchemaParsable<YasumuSchemaParsableToType<E> | null> {
    constructor(public readonly expect: E) {
        super();
    }

    canParse(parser: YasumuSchemaParser) {
        return (
            parser.check(YasumuSchemaTokenTypes.NULL) ||
            this.expect.canParse(parser)
        );
    }

    parse(parser: YasumuSchemaParser) {
        if (parser.match(YasumuSchemaTokenTypes.NULL)) {
            return null;
        }
        return this.expect.parse(parser) as YasumuSchemaParsableToType<E>;
    }

    canSerialize(serializer: YasumuSchemaSerializer, value: any) {
        return (
            value === undefined ||
            value === null ||
            this.expect.canSerialize(serializer, value)
        );
    }

    serialize(
        serializer: YasumuSchemaSerializer,
        value: YasumuSchemaParsableToType<E>,
    ) {
        if (value === undefined || value === null) {
            return "null";
        }
        return this.expect.serialize(serializer, value);
    }
}
