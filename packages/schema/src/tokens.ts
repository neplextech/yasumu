import { YasumuSchemaUtils } from './utils.js';

const YasumuSchemaTokenType = [
  'ILLEGAL',
  'EOF',
  'ANNOTATION',
  'IDENTIFIER',
  'TRUE',
  'FALSE',
  'NULL',
  'NUMBER',
  'STRING',
  'LEFT_CURLY_BRACKET', // {
  'RIGHT_CURLY_BRACKET', // }
  'LEFT_SQUARE_BRACKET', // [
  'RIGHT_SQUARE_BRACKET', // ]
  'COLON', // :
  'COMMA', // ,
] as const;

export type YasumuSchemaTokenType = (typeof YasumuSchemaTokenType)[number];

export const YasumuSchemaTokenTypes = YasumuSchemaUtils.enum(
  YasumuSchemaTokenType,
);

export interface YasumuSchemaTokenSpanPosition {
  line: number;
  column: number;
}

export interface YasumuSchemaTokenSpan {
  start: YasumuSchemaTokenSpanPosition;
  end: YasumuSchemaTokenSpanPosition;
}

export interface YasumuSchemaToken {
  type: YasumuSchemaTokenType;
  value: string;
  span: YasumuSchemaTokenSpan;
  error?: string;
}
