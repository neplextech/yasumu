export type FetchAdditional<T> = T & {
  maxRedirects?: number;
  timeout?: number;
};

export type FetchCommon = (
  input: RequestInfo,
  init?: FetchAdditional<RequestInit>,
) => Promise<Response>;
