import type { JsonValue } from '@yasumu/runtime-api';

import { YasumuError, YasumuErrorCodes } from './errors.js';

const exactExpression = /^\s*\{\{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*\}\}\s*$/;
const expression = /\{\{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*\}\}/g;
const escapedOpening = /\\\{\{/g;
const escapedSentinel = '\u0000YASUMU_ESCAPED_OPEN\u0000';

export interface InterpolationOptions {
  missing?: 'error' | 'preserve' | 'empty';
  maxDepth?: number;
}

export interface InterpolationValues {
  variables?: Readonly<Record<string, JsonValue>>;
  secrets?: Readonly<Record<string, string>>;
}

export class Interpolator {
  private readonly values: Readonly<Record<string, JsonValue>>;
  private readonly variables: Readonly<Record<string, JsonValue>>;
  private readonly secrets: Readonly<Record<string, string>>;
  private readonly missing: NonNullable<InterpolationOptions['missing']>;
  private readonly maxDepth: number;

  constructor(values: InterpolationValues, options: InterpolationOptions = {}) {
    this.variables = values.variables ?? {};
    this.secrets = values.secrets ?? {};
    this.values = { ...this.variables, ...this.secrets };
    this.missing = options.missing ?? 'error';
    this.maxDepth = options.maxDepth ?? 10;
  }

  interpolate<T extends JsonValue>(value: T): T {
    return this.interpolateValue(value, [], 0) as T;
  }

  interpolateString(value: string): JsonValue {
    return this.interpolateStringInternal(value, [], 0);
  }

  private interpolateValue(value: JsonValue, stack: string[], depth: number): JsonValue {
    this.assertDepth(depth);
    if (typeof value === 'string') return this.interpolateStringInternal(value, stack, depth);
    if (Array.isArray(value)) return value.map((entry) => this.interpolateValue(entry, stack, depth + 1));
    if (value && typeof value === 'object') {
      const result: Record<string, JsonValue> = {};
      for (const [key, entry] of Object.entries(value)) {
        const interpolatedKey = this.interpolateStringInternal(key, stack, depth + 1);
        if (typeof interpolatedKey !== 'string') {
          throw new YasumuError(YasumuErrorCodes.InterpolationError, 'Interpolated object keys must be strings');
        }
        result[interpolatedKey] = this.interpolateValue(entry, stack, depth + 1);
      }
      return result;
    }
    return value;
  }

  private interpolateStringInternal(input: string, stack: string[], depth: number): JsonValue {
    this.assertDepth(depth);
    const protectedInput = input.replace(escapedOpening, escapedSentinel);
    const exact = protectedInput.match(exactExpression);
    if (exact) {
      const key = exact[1]!;
      const resolved = this.resolve(key, stack, depth + 1);
      if (resolved === undefined) return this.missingValue(input, key);
      return typeof resolved === 'string' ? resolved.replaceAll(escapedSentinel, '{{') : resolved;
    }

    const output = protectedInput.replace(expression, (token, key: string) => {
      const resolved = this.resolve(key, stack, depth + 1);
      if (resolved === undefined) return this.missingValue(token, key);
      if (resolved === null) return 'null';
      if (typeof resolved === 'object') return JSON.stringify(resolved);
      return String(resolved);
    });

    if (output === protectedInput) return output.replaceAll(escapedSentinel, '{{');
    return this.interpolateStringInternal(output.replaceAll(escapedSentinel, '{{'), stack, depth + 1);
  }

  private resolve(key: string, stack: string[], depth: number): JsonValue | undefined {
    let value: JsonValue | undefined;
    if (key.startsWith('variables.') && key.slice('variables.'.length) in this.variables) {
      value = this.variables[key.slice('variables.'.length)];
    } else if (key.startsWith('secrets.') && key.slice('secrets.'.length) in this.secrets) {
      value = this.secrets[key.slice('secrets.'.length)];
    } else {
      value = this.values[key];
    }
    if (value === undefined) return this.missing === 'error' ? this.throwMissing(key) : undefined;
    if (stack.includes(key)) {
      throw new YasumuError(
        YasumuErrorCodes.InterpolationError,
        `Interpolation cycle detected: ${[...stack, key].join(' -> ')}`,
      );
    }
    return typeof value === 'string' ? this.interpolateStringInternal(value, [...stack, key], depth) : value;
  }

  private missingValue(token: string, key: string): string {
    if (this.missing === 'preserve') return token;
    if (this.missing === 'empty') return '';
    return this.throwMissing(key);
  }

  private throwMissing(key: string): never {
    throw new YasumuError(YasumuErrorCodes.MissingVariable, `Missing interpolation value: ${key}`);
  }

  private assertDepth(depth: number): void {
    if (depth > this.maxDepth) {
      throw new YasumuError(
        YasumuErrorCodes.InterpolationError,
        `Interpolation exceeded the maximum depth of ${this.maxDepth}`,
      );
    }
  }
}

export class SecretRedactor {
  private readonly secrets: string[];

  constructor(values: Iterable<string>) {
    this.secrets = [...new Set(values)].filter(Boolean).sort((a, b) => b.length - a.length);
  }

  redact(value: string): string {
    let redacted = value;
    for (const secret of this.secrets) redacted = redacted.replaceAll(secret, '[REDACTED]');
    return redacted;
  }

  redactValue<T>(value: T): T {
    if (typeof value === 'string') return this.redact(value) as T;
    if (Array.isArray(value)) return value.map((entry) => this.redactValue(entry)) as T;
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [this.redact(key), this.redactValue(entry)]),
      ) as T;
    }
    return value;
  }
}
