export const GraphqlHttpMethod = {
  Get: 'GET',
  Post: 'POST',
} as const;

export type GraphqlHttpMethod =
  (typeof GraphqlHttpMethod)[keyof typeof GraphqlHttpMethod];
