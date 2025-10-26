import { HttpMethod } from './constants.js';

export interface RestEntityBody {
  type: 'json' | 'text' | 'form-data' | 'multipart/form-data';
  data: unknown;
}

export interface RestEntityScript {
  type: 'beforeRequest' | 'afterResponse';
  code: string;
}

export interface RestEntityData {
  url: string | null;
  name: string | null;
  method: HttpMethod;
  searchParameters: Record<string, string>;
  headers: Record<string, string>;
  body: RestEntityBody | null;
  scripts: RestEntityScript[];
}
