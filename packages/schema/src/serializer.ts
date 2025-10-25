import type {
    YasumuSchemaParsable,
    YasumuSchemaParsableToType,
} from "./parsable.js";
import { YasumuSchemaUtils } from "./utils.js";

/**
 * This is highly experimental. Use with caution.
 */
export class YasumuSchemaSerializer {
    indentation = 2;
    depth = 0;
    keyPath: string[] = [];

    serialize<T extends YasumuSchemaParsable<unknown>>(
        parsable: T,
        value: YasumuSchemaParsableToType<T>,
    ) {
        try {
            return parsable.serialize(this, value);
        } catch (err) {
            throw new Error(
                `Error occured when serializing "${this.keyPath.join(".")}"`,
                // @ts-ignore
                { cause: err },
            );
        }
    }

    serializeIdentifier(value: string) {
        if (YasumuSchemaUtils.isIdentifierString(value)) {
            return value;
        }
        return `\`${value}\``;
    }

    indent() {
        let output = "";
        for (let i = 0; i < this.depth; i++) {
            output += " ".repeat(this.indentation);
        }
        return output;
    }

    incrementIndent() {
        this.depth++;
    }

    decrementIndent() {
        this.depth--;
    }

    setIdentation(indentation: number) {
        this.indentation = indentation;
    }
}
