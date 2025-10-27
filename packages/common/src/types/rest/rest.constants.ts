export const HttpMethods = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Delete: 'DELETE',
  Patch: 'PATCH',
  Options: 'OPTIONS',
  Head: 'HEAD',
} as const;

export type HttpMethod = (typeof HttpMethods)[keyof typeof HttpMethods];
