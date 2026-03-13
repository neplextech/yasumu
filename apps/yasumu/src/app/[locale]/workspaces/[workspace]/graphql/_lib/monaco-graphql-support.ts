'use client';

import { useEffect, useRef } from 'react';
import type { GraphQLSchema } from 'graphql';
import type { Monaco } from '@monaco-editor/react';
import { getMonacoInstance } from '@/components/editors/text-editor';

let isGraphQLInitialized = false;
let graphqlInitPromise: Promise<void> | null = null;
let currentSchema: GraphQLSchema | null = null;
let completionProviderDisposable: { dispose: () => void } | null = null;
let hoverProviderDisposable: { dispose: () => void } | null = null;

const GLOBAL_PROVIDER_KEY = '__yasumuGraphqlProviders';

type Disposable = { dispose: () => void };

type GlobalGraphqlProviders = {
  completion: Disposable | null;
  hover: Disposable | null;
};

function getGlobalGraphqlProviders(): GlobalGraphqlProviders {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_PROVIDER_KEY]?: GlobalGraphqlProviders;
  };

  if (!g[GLOBAL_PROVIDER_KEY]) {
    g[GLOBAL_PROVIDER_KEY] = { completion: null, hover: null };
  }

  return g[GLOBAL_PROVIDER_KEY]!;
}

function markdownToString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const maybeMarkup = value as { value?: unknown };
    if (typeof maybeMarkup.value === 'string') return maybeMarkup.value;
  }
  return '';
}

async function ensureGraphQLProviders(monaco: Monaco) {
  if (isGraphQLInitialized) return;
  if (graphqlInitPromise) {
    await graphqlInitPromise;
    return;
  }

  graphqlInitPromise = (async () => {
    const globalProviders = getGlobalGraphqlProviders();
    // In dev HMR, old providers can survive module reloads and duplicate results.
    globalProviders.completion?.dispose();
    globalProviders.hover?.dispose();
    globalProviders.completion = null;
    globalProviders.hover = null;

    const { getAutocompleteSuggestions, getHoverInformation, Position } =
      await import('graphql-language-service');

    completionProviderDisposable =
      monaco.languages.registerCompletionItemProvider('graphql', {
        triggerCharacters: [' ', '\n', '{', '(', ':', '@'],
        provideCompletionItems: (model, position) => {
          if (!currentSchema) return { suggestions: [] };

          try {
            const suggestions = getAutocompleteSuggestions(
              currentSchema,
              model.getValue(),
              new Position(position.lineNumber - 1, position.column - 1),
            );

            const seen = new Set<string>();
            const uniqueSuggestions = suggestions.filter((entry) => {
              const key = `${entry.label}::${entry.insertText ?? ''}::${entry.kind ?? ''}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });

            return {
              suggestions: uniqueSuggestions.map((entry) => ({
                label: entry.label,
                kind: entry.kind as monaco.languages.CompletionItemKind,
                detail: entry.detail,
                insertText: entry.insertText || entry.label,
                insertTextRules:
                  entry.insertTextFormat === 2
                    ? monaco.languages.CompletionItemInsertTextRule
                        .InsertAsSnippet
                    : undefined,
                sortText: entry.sortText,
                filterText: entry.filterText,
                documentation: markdownToString(entry.documentation),
              })),
            };
          } catch {
            return { suggestions: [] };
          }
        },
      });

    hoverProviderDisposable = monaco.languages.registerHoverProvider(
      'graphql',
      {
        provideHover: (model, position) => {
          if (!currentSchema) return null;

          try {
            const hover = getHoverInformation(
              currentSchema,
              model.getValue(),
              new Position(position.lineNumber - 1, position.column - 1),
            );

            const text = markdownToString(hover);
            if (!text) return null;

            return {
              contents: [{ value: text }],
            };
          } catch {
            return null;
          }
        },
      },
    );

    globalProviders.completion = completionProviderDisposable;
    globalProviders.hover = hoverProviderDisposable;

    isGraphQLInitialized = true;
  })();

  try {
    await graphqlInitPromise;
  } finally {
    graphqlInitPromise = null;
  }
}

export function useMonacoGraphqlLanguage(schema: GraphQLSchema | null) {
  const apiRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;

    async function setupGraphQL() {
      try {
        const monaco = await getMonacoInstance();

        if (!mounted) return;

        await ensureGraphQLProviders(monaco);
        currentSchema = schema;
        apiRef.current = {
          setSchemaConfig: (configs: Array<{ schema: GraphQLSchema }>) => {
            currentSchema = configs[0]?.schema ?? null;
          },
          dispose: () => {
            completionProviderDisposable?.dispose();
            hoverProviderDisposable?.dispose();
            completionProviderDisposable = null;
            hoverProviderDisposable = null;
            isGraphQLInitialized = false;
            graphqlInitPromise = null;
          },
        };
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
    await ensureGraphQLProviders(monaco);
    currentSchema = schema ?? null;

    return {
      setSchemaConfig: (configs: Array<{ schema: GraphQLSchema }>) => {
        currentSchema = configs[0]?.schema ?? null;
      },
    };
  } catch (error) {
    console.error('Failed to preload GraphQL language:', error);
  }
}
