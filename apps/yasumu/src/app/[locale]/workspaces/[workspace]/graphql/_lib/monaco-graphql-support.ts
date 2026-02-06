'use client';

import { useEffect, useRef } from 'react';
import type { GraphQLSchema } from 'graphql';
import { getMonacoInstance } from '@/components/editors/text-editor';

let isGraphQLInitialized = false;
let monacoGraphQLAPI: any = null;

export function useMonacoGraphqlLanguage(schema: GraphQLSchema | null) {
  const apiRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;

    async function setupGraphQL() {
      try {
        const monaco = await getMonacoInstance();

        if (!mounted) return;

        if (!isGraphQLInitialized) {
          const { initializeMode } = await import(
            'monaco-graphql/initializeMode'
          );

          // Initialize the mode
          const api = initializeMode({
            schemas: schema
              ? [
                  {
                    schema,
                    uri: 'inmemory://model/query.graphql',
                    fileMatch: ['**/*.graphql'],
                  },
                ]
              : [],
          });

          monacoGraphQLAPI = api;
          isGraphQLInitialized = true;
          apiRef.current = api;
        } else if (schema && monacoGraphQLAPI?.setSchemaConfig) {
          monacoGraphQLAPI.setSchemaConfig([
            {
              schema,
              uri: 'https://myschema.com/schema.graphql',
              fileMatch: ['**/*.graphql'],
            },
          ]);
          apiRef.current = monacoGraphQLAPI;
        }
      } catch (error) {
        console.error('Failed to setup GraphQL language support:', error);
      }
    }

    setupGraphQL();

    return () => {
      mounted = false;
    };
  }, [schema]);

  return apiRef.current;
}

export async function preloadGraphQLLanguage(schema?: GraphQLSchema | null) {
  if (typeof window === 'undefined') return;

  try {
    const monaco = await getMonacoInstance();

    if (!isGraphQLInitialized) {
      const { initializeMode } = await import('monaco-graphql/initializeMode');

      const api = initializeMode({
        schemas: schema
          ? [
              {
                schema,
                uri: 'https://myschema.com/schema.graphql',
                fileMatch: ['**/*.graphql'],
              },
            ]
          : [],
      });

      monacoGraphQLAPI = api;
      isGraphQLInitialized = true;
      return api;
    }

    return monacoGraphQLAPI;
  } catch (error) {
    console.error('Failed to preload GraphQL language:', error);
  }
}
