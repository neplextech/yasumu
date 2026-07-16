import { YasumuSchemaParserError, type YasumuSchemaParser } from '../parser.js';
import type { YasumuSchemaSerializer } from '../serializer.js';
import { YasumuSchemaTokenTypes } from '../tokens.js';
import { YasumuSchemaParsableNullable } from './nullable.js';
import {
  YasumuSchemaParsableOptional,
  type YasumuSchemaOptionalKeys,
  type YasumuSchemaRequiredKeys,
} from './optional.js';
import { YasumuSchemaParsable, type YasumuSchemaParsableToType } from './parsable.js';

export type _YasumuSchemaParsableScriptExpect = {
  annotation: string;
  blocks: {
    [K: string]: YasumuSchemaParsable<unknown>;
  };
};

export type _YasumuSchemaParsableScriptReturn<T extends _YasumuSchemaParsableScriptExpect> = {
  annotation: T['annotation'];
  blocks: {
    [K in YasumuSchemaRequiredKeys<T['blocks']>]: YasumuSchemaParsableToType<T['blocks'][K]>;
  } & {
    [K in YasumuSchemaOptionalKeys<T['blocks']>]?: YasumuSchemaParsableToType<T['blocks'][K]>;
  };
};

export class YasumuSchemaParsableScript<E extends _YasumuSchemaParsableScriptExpect> extends YasumuSchemaParsable<
  _YasumuSchemaParsableScriptReturn<E>
> {
  constructor(public readonly expect: E) {
    super();
  }

  parse(parser: YasumuSchemaParser) {
    const blocks: Record<string, unknown> = {};
    const keys = new Set(Object.keys(this.expect.blocks));
    const parsedKeys = new Set<string>();
    const annotation = this.parseAnnotation(parser);
    while (!parser.isEOF()) {
      const [key, value] = this.parseBlock(parser, parsedKeys);
      blocks[key] = value;
      keys.delete(key);
      parsedKeys.add(key);
    }
    for (const x of keys) {
      const nullable = this.expect.blocks[x]! instanceof YasumuSchemaParsableNullable;
      const optional = this.expect.blocks[x]! instanceof YasumuSchemaParsableOptional;
      if (!nullable && !optional && !(x in blocks)) {
        throw new YasumuSchemaParserError(`Missing required block '${x}'`, parser.currentToken.span);
      }
      if (nullable) {
        blocks[x] ??= null;
      }
    }
    return { annotation, blocks } as _YasumuSchemaParsableScriptReturn<E>;
  }

  parseAnnotation(parser: YasumuSchemaParser) {
    const annotation = parser.consume(YasumuSchemaTokenTypes.ANNOTATION);
    if (annotation.value !== this.expect.annotation) {
      throw new YasumuSchemaParserError(
        `Expected '${this.expect.annotation}' annotation, received '${annotation.value}'`,
        annotation.span,
      );
    }
    return annotation.value;
  }

  parseBlock(parser: YasumuSchemaParser, parsedKeys: ReadonlySet<string> = new Set()) {
    const identifier = parser.consume(YasumuSchemaTokenTypes.IDENTIFIER);
    if (parsedKeys.has(identifier.value)) {
      throw new YasumuSchemaParserError(`Duplicate block '${identifier.value}'`, identifier.span);
    }
    const parsable = this.expect.blocks[identifier.value];
    if (!parsable) {
      throw new YasumuSchemaParserError(`Unexpected block '${identifier.value}'`, identifier.span);
    }
    const value = parsable.parse(parser);
    return [identifier.value, value] as const;
  }

  serialize(serializer: YasumuSchemaSerializer, value: _YasumuSchemaParsableScriptReturn<E>) {
    let output = `@${value.annotation}\n\n`;
    const blocks = value.blocks as {
      [K in keyof E['blocks']]?: YasumuSchemaParsableToType<E['blocks'][K]>;
    };
    for (const x of Object.keys(this.expect.blocks) as (keyof E['blocks'] & string)[]) {
      const xSchema = this.expect.blocks[x]!;
      const xValue = blocks[x];
      if (xSchema instanceof YasumuSchemaParsableOptional && xValue === undefined) {
        continue;
      }
      if (xSchema instanceof YasumuSchemaParsableNullable && (xValue === undefined || xValue === null)) {
        continue;
      }
      serializer.keyPath.push(x);
      output += serializer.serializeIdentifier(x) + ' ';
      output += xSchema.serialize(serializer, xValue);
      output += '\n\n';
      serializer.keyPath.pop();
    }
    return output;
  }
}
