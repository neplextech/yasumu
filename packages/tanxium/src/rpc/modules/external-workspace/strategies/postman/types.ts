export interface PostmanVariable {
  key: string;
  value: string;
  type?: string;
  disabled?: boolean;
}

export interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
}

export interface PostmanQueryParam {
  key: string;
  value: string;
  disabled?: boolean;
}

export interface PostmanUrlPath {
  raw?: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: PostmanQueryParam[];
  variable?: PostmanVariable[];
}

export interface PostmanBody {
  mode?: 'raw' | 'urlencoded' | 'formdata' | 'file' | 'graphql';
  raw?: string;
  urlencoded?: Array<{ key: string; value: string; disabled?: boolean }>;
  formdata?: Array<{
    key: string;
    value: string;
    type?: string;
    disabled?: boolean;
  }>;
  options?: {
    raw?: {
      language?: string;
    };
  };
}

export interface PostmanRequest {
  method: string;
  header?: PostmanHeader[];
  body?: PostmanBody;
  url?: string | PostmanUrlPath;
  auth?: PostmanAuth;
}

export interface PostmanAuthItem {
  key?: string;
  value?: string;
  type?: string;
  disabled?: boolean;
}

export interface PostmanAuth {
  type: 'basic' | 'bearer';
  bearer?: PostmanAuthItem[];
  basic?: PostmanAuthItem[];
}

export interface PostmanEvent {
  listen: 'prerequest' | 'test';
  script?: {
    exec?: string[];
    type?: string;
  };
}

export interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  response?: unknown[];
  item?: PostmanItem[];
  event?: PostmanEvent[];
}

export interface PostmanEnvironment {
  name: string;
  values: Array<{
    key: string;
    value: string;
    type?: string;
    enabled?: boolean;
  }>;
}

export interface PostmanCollection {
  info?: {
    name?: string;
    schema?: string;
  };
  item?: PostmanItem[];
  variable?: PostmanVariable[];
  event?: PostmanEvent[];
}
