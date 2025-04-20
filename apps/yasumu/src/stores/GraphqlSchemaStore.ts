import { useStore } from '@nanostores/react';
import { GraphqlQueryVariableType, IntrospectionQuery } from '@yasumu/core';
import { atom } from 'nanostores';

export const $graphqlSchema = atom<IntrospectionQuery | null>(null);
export const $graphqlResult = atom<string>('');
export const $graphqlDocument =
  atom<string>(`query GetProductList($term: String, $take: Int) {
  products(
    options: {
      take: $take
      filter: { name: { contains: $term } }
      sort: { name: ASC }
    }
  ) {
    totalItems
    items {
      id
      name
      slug
      featuredAsset {
        preview
        mimeType
        width
        height
      }
    }
  }
}`);

export type GraphqlVariable = Record<
  string,
  {
    key: string;
    value: GraphqlQueryVariableType;
    enabled: boolean;
  }
>;

export const $graphqlVariables = atom<GraphqlVariable>({
  term: { key: 'term', value: 'shoe', enabled: true },
  take: { key: 'take', value: 2, enabled: true },
});

export function setGraphqlSchema(schema: IntrospectionQuery | null) {
  $graphqlSchema.set(schema);
}

export function useGraphqlSchema() {
  return useStore($graphqlSchema);
}

export function setGraphqlResult(result: string) {
  $graphqlResult.set(
    typeof result !== 'string' ? JSON.stringify(result, null, 2) : result,
  );
}

export function useGraphqlResult() {
  return useStore($graphqlResult);
}

export function setGraphqlDocument(result: string) {
  $graphqlDocument.set(typeof result !== 'string' ? '' : result);
}

export function useGraphqlDocument() {
  return useStore($graphqlDocument);
}

export function setGraphqlVariables(variables: GraphqlVariable) {
  $graphqlVariables.set(variables);
}

export function updateGraphqlVariables(variables: GraphqlVariable) {
  $graphqlVariables.set({ ...$graphqlVariables.get(), ...variables });
}

export function removeGraphqlVariable(key: string) {
  const variables = { ...$graphqlVariables.get() };
  delete variables[key];
  $graphqlVariables.set(variables);
}

export function clearGraphqlVariables() {
  $graphqlVariables.set({});
}

export function useGraphqlVariables() {
  return useStore($graphqlVariables);
}
