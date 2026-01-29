'use client';

import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useActiveWorkspace,
  useYasumu,
} from '@/components/providers/workspace-provider';
import { useEnvironmentStore } from '@/app/[locale]/workspaces/_stores/environment-store';
import {
  GraphqlRequestController,
  GraphqlResponse,
} from '../_lib/graphql-request';
import type { GraphqlEntityData } from './use-graphql-entity';
import type { TestResult } from '@yasumu/common';

export type RequestPhase =
  | 'idle'
  | 'pre-request-script'
  | 'sending'
  | 'post-response-script'
  | 'completed'
  | 'error'
  | 'cancelled';

export type ScriptOutputType =
  | 'info'
  | 'success'
  | 'error'
  | 'warning'
  | 'test-pass'
  | 'test-fail'
  | 'test-skip';

export interface ScriptOutputEntry {
  message: string;
  type: ScriptOutputType;
  timestamp: number;
}

export interface RequestState {
  phase: RequestPhase;
  response: GraphqlResponse | null;
  error: string | null;
  scriptOutput: ScriptOutputEntry[];
  testResults: TestResult[];
}

interface UseGraphqlRequestOptions {
  entityId: string | null;
}

interface UseGraphqlRequestReturn {
  state: RequestState;
  execute: (entity: GraphqlEntityData) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

const INITIAL_STATE: RequestState = {
  phase: 'idle',
  response: null,
  error: null,
  scriptOutput: [],
  testResults: [],
};

export function useGraphqlRequest({
  entityId,
}: UseGraphqlRequestOptions): UseGraphqlRequestReturn {
  const workspace = useActiveWorkspace();
  const { echoServerPort } = useYasumu();
  const { interpolate } = useEnvironmentStore();
  const [state, setState] = useState<RequestState>(INITIAL_STATE);
  const controllerRef = useRef(new GraphqlRequestController());
  const isCancelledRef = useRef(false);
  const { selectedEnvironment } = useEnvironmentStore();
  const queryClient = useQueryClient();

  // GraphQL API accessor (will be implemented in core)
  const graphql = workspace.graphql;

  const appendScriptOutput = useCallback(
    (message: string, type: ScriptOutputType = 'info') => {
      setState((prev) => ({
        ...prev,
        scriptOutput: [
          ...prev.scriptOutput,
          { message, type, timestamp: Date.now() },
        ],
      }));
    },
    [],
  );

  const execute = useCallback(
    async (_entity: GraphqlEntityData) => {
      if (!entityId) return;

      isCancelledRef.current = false;
      setState({
        phase: 'idle',
        response: null,
        error: null,
        scriptOutput: [],
        testResults: [],
      });

      // Fetch fresh entity data
      let entity = _entity;
      if (graphql) {
        const freshEntity = await graphql.get(entityId);
        if (freshEntity) {
          entity = freshEntity.data as GraphqlEntityData;
        }
      }

      if (!entity) {
        setState((prev) => ({
          ...prev,
          phase: 'error',
          error: 'Entity not found',
        }));
        return;
      }

      const interpolateValue = (value: string) => interpolate(value);
      const interpolatedUrl = interpolateValue(entity.url || '');
      const interpolatedHeaders = Object.fromEntries(
        (entity.requestHeaders || [])
          .filter((h) => h.enabled && h.key)
          .map((h) => [interpolateValue(h.key), interpolateValue(h.value)]),
      );
      const interpolatedQuery = entity.query
        ? interpolateValue(entity.query)
        : '';
      const interpolatedVariables = entity.variables
        ? interpolateValue(entity.variables)
        : null;

      try {
        // Pre-request script execution would go here
        // For now, skip since we're assuming the API will be implemented later

        if (isCancelledRef.current) {
          setState((prev) => ({ ...prev, phase: 'cancelled' }));
          return;
        }

        setState((prev) => ({ ...prev, phase: 'sending' }));

        const outcome = await controllerRef.current.execute({
          url: interpolatedUrl,
          query: interpolatedQuery,
          variables: interpolatedVariables,
          operationName: entity.operationName,
          headers: interpolatedHeaders,
          echoServerPort,
          interpolate,
        });

        if (isCancelledRef.current) {
          setState((prev) => ({ ...prev, phase: 'cancelled' }));
          return;
        }

        if (outcome.error) {
          setState((prev) => ({
            ...prev,
            phase: 'error',
            error: outcome.error,
          }));
          return;
        }

        const response = outcome.response!;
        setState((prev) => ({ ...prev, response }));

        // Post-response script execution would go here
        // For now, skip since we're assuming the API will be implemented later

        setState((prev) => ({ ...prev, phase: 'completed' }));
      } catch (err) {
        if (!isCancelledRef.current) {
          setState((prev) => ({
            ...prev,
            phase: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          }));
        }
      }
    },
    [entityId, workspace, echoServerPort, interpolate, selectedEnvironment],
  );

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
    controllerRef.current.cancel();
    setState((prev) => ({
      ...prev,
      phase: 'cancelled',
      error: 'Request cancelled',
    }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    execute,
    cancel,
    reset,
  };
}
