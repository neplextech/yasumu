'use client';

import { useEffect, useRef } from 'react';
import type { GraphQLSchema } from 'graphql';

/**
 * Initializes monaco-graphql language mode for IntelliSense and autocomplete.
 * This sets up the GraphQL language worker for Monaco editor.
 */
export function useMonacoGraphqlLanguage(schema: GraphQLSchema | null) {
  const schemaRef = useRef<GraphQLSchema | null>(null);

  useEffect(() => {
    if (!schema) return;
    schemaRef.current = schema;

    let cleanup: (() => void) | undefined;

    const initGraphqlMode = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { initializeMode } = await import('monaco-graphql/initializeMode');

        const api = initializeMode({
          schemas: [
            {
              // Introspection result will be used for IntelliSense
              introspectionJSON: undefined,
              uri: 'schema.graphql',
            },
          ],
        });

        // If we have a schema, set it for IntelliSense
        if (schemaRef.current) {
          const { printSchema } = await import('graphql');
          const sdl = printSchema(schemaRef.current);

          api.setSchemaConfig([
            {
              uri: 'schema.graphql',
              documentString: sdl,
            },
          ]);
        }

        cleanup = () => {
          // monaco-graphql mode cleanup is global, no individual dispose needed
        };
      } catch (err) {
        console.warn('Failed to initialize monaco-graphql:', err);
      }
    };

    initGraphqlMode();

    return () => {
      cleanup?.();
    };
  }, [schema]);
}
