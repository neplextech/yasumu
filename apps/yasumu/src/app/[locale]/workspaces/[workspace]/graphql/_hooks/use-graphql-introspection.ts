'use client';

import { useCallback, useRef, useState } from 'react';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import {
  buildClientSchema,
  getIntrospectionQuery,
  type GraphQLSchema,
  type IntrospectionQuery,
} from 'graphql';

export interface IntrospectionState {
  schema: GraphQLSchema | null;
  introspectionResult: IntrospectionQuery | null;
  isLoading: boolean;
  error: string | null;
}

const INITIAL_STATE: IntrospectionState = {
  schema: null,
  introspectionResult: null,
  isLoading: false,
  error: null,
};

export function useGraphqlIntrospection() {
  const [state, setState] = useState<IntrospectionState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const introspect = useCallback(async (url: string, headers?: Record<string, string>) => {
    if (!url) {
      setState((prev) => ({ ...prev, error: 'URL is required' }));
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const requestHeaders = new Headers({
        'Content-Type': 'application/json',
        'user-agent': 'Yasumu/1.0',
        origin: 'http://localhost',
      });

      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          if (key) requestHeaders.set(key, value);
        }
      }

      const body = JSON.stringify({ query: getIntrospectionQuery() });

      const response = await tauriFetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body,
        signal: abortRef.current.signal,
      });

      const json = await response.json();

      if (json.errors && json.errors.length > 0) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Introspection failed: ${json.errors[0].message}`,
        }));
        return;
      }

      if (!json.data) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Invalid introspection response: no data field',
        }));
        return;
      }

      const introspectionResult = json.data as IntrospectionQuery;
      const schema = buildClientSchema(introspectionResult);

      setState({
        schema,
        introspectionResult,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Introspection failed',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  return { ...state, introspect, reset };
}
