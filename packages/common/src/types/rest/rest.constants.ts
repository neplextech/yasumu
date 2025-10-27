/**
 * The HTTP methods.
 */
export const HttpMethods = {
  /**
   * The GET method.
   */
  Get: 'GET',
  /**
   * The POST method.
   */
  Post: 'POST',
  /**
   * The PUT method.
   */
  Put: 'PUT',
  /**
   * The DELETE method.
   */
  Delete: 'DELETE',
  /**
   * The PATCH method.
   */
  Patch: 'PATCH',
  /**
   * The OPTIONS method.
   */
  Options: 'OPTIONS',
  /**
   * The HEAD method.
   */
  Head: 'HEAD',
} as const;

/**
 * The type of the HTTP method.
 */
export type HttpMethod =
  | (typeof HttpMethods)[keyof typeof HttpMethods]
  | (string & {});
