export interface DatabaseTable {
  ensureTable(): void;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type BodyType = 'JSON' | 'Text' | 'FormData';

export interface KeyValue {
  key: string;
  value: string;
}

export interface Body {
  content: string;
  type: BodyType;
}
