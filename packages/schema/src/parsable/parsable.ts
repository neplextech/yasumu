import { YasumuSchemaParserError, type YasumuSchemaParser } from "../parser.js";
import type { YasumuSchemaSerializer } from "../serializer.js";

export abstract class YasumuSchemaParsable<T> {
    canParse(parser: YasumuSchemaParser): boolean {
        throw new YasumuSchemaParserError(
            "Parsable does not support parse check operation",
        );
    }

    canSerialize(serializer: YasumuSchemaSerializer, value: any): boolean {
        throw new YasumuSchemaParserError(
            "Parsable does not support serialize check operation",
        );
    }

    abstract parse(parser: YasumuSchemaParser): T;
    abstract serialize(serializer: YasumuSchemaSerializer, value: T): string;
}

export type YasumuSchemaParsableToType<
    T extends YasumuSchemaParsable<unknown>,
> = T extends YasumuSchemaParsable<infer U> ? U : never;
