import { YasumuSchemaParsableBoolean } from './boolean.js';
import { YasumuSchemaParsableCode } from './code.js';
import {
  YasumuSchemaParsableEnum,
  type _YasumuSchemaParsableEnumExpect,
} from './enum.js';
import { YasumuSchemaParsableList } from './list.js';
import { YasumuSchemaParsableNull } from './null.js';
import { YasumuSchemaParsableNullable } from './nullable.js';
import { YasumuSchemaParsableNumber } from './number.js';
import {
  YasumuSchemaParsableObject,
  type _YasumuSchemaParsableObjectExpect,
} from './object.js';
import type { YasumuSchemaParsable } from './parsable.js';
import { YasumuSchemaParsableRecord } from './record.js';
import {
  YasumuSchemaParsableScript,
  type _YasumuSchemaParsableScriptExpect,
} from './script.js';
import { YasumuSchemaParsableString } from './string.js';
import {
  YasumuSchemaParsableUnion,
  type _YasumuSchemaParsableUnionExpect,
} from './union.js';

export class YasumuSchemaFactory {
  script<E extends _YasumuSchemaParsableScriptExpect>(expect: E) {
    return new YasumuSchemaParsableScript(expect);
  }

  code() {
    return new YasumuSchemaParsableCode();
  }

  object<E extends _YasumuSchemaParsableObjectExpect>(expect: E) {
    return new YasumuSchemaParsableObject(expect);
  }

  record<E extends YasumuSchemaParsable<unknown>>(expect: E) {
    return new YasumuSchemaParsableRecord(expect);
  }

  list<E extends YasumuSchemaParsable<unknown>>(expect: E) {
    return new YasumuSchemaParsableList(expect);
  }

  string() {
    return YasumuSchemaParsableString.instance;
  }

  number() {
    return YasumuSchemaParsableNumber.instance;
  }

  boolean() {
    return YasumuSchemaParsableBoolean.instance;
  }

  null() {
    return YasumuSchemaParsableNull.instance;
  }

  nullable<E extends YasumuSchemaParsable<unknown>>(expect: E) {
    return new YasumuSchemaParsableNullable(expect);
  }

  union<E extends _YasumuSchemaParsableUnionExpect>(...expect: E) {
    return new YasumuSchemaParsableUnion(...expect);
  }

  enum<E extends _YasumuSchemaParsableEnumExpect>(...expect: E) {
    return new YasumuSchemaParsableEnum(...expect);
  }
}

export const t = new YasumuSchemaFactory();
