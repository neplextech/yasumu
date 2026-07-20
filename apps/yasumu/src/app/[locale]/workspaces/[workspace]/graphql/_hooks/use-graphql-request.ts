'use client';

import type { GraphqlEntityData, TestResult } from '@yasumu/core';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  outputFromExecutionEvent,
  outputsFromExecution,
  phaseFromExecutionEvent,
  type RequestPhase,
  type ScriptOutputEntry,
} from '@/app/[locale]/workspaces/[workspace]/_lib/headless-execution';
import { useEnvironmentStore } from '@/app/[locale]/workspaces/_stores/environment-store';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { trackEvent, trackTiming } from '@/lib/instrumentation/analytics';

import { graphqlResponseFromExecution, type GraphqlResponse } from '../_lib/graphql-request';

function isSubscription(document: string): boolean {
  return /^(?:\s|#[^\n]*(?:\n|$))*subscription\b/.test(document);
}

function interpolateJson(value: unknown, interpolate: (value: string) => string): unknown {
  if (typeof value === 'string') return interpolate(value);
  if (Array.isArray(value)) return value.map((entry) => interpolateJson(entry, interpolate));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [interpolate(key), interpolateJson(entry, interpolate)]),
    );
  }
  return value;
}

function rawError(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        entry && typeof entry === 'object' && 'message' in entry ? String(entry.message) : String(entry),
      )
      .join(', ');
  }
  return typeof value === 'string' ? value : 'GraphQL subscription failed';
}

export type {
  RequestPhase,
  ScriptOutputEntry,
  ScriptOutputType,
} from '@/app/[locale]/workspaces/[workspace]/_lib/headless-execution';

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

export function useGraphqlRequest({ entityId }: UseGraphqlRequestOptions): UseGraphqlRequestReturn {
  const workspace = useActiveWorkspace();
  const environmentId = useEnvironmentStore((store) => store.selectedEnvironment?.id);
  const [state, setState] = useState<RequestState>(INITIAL_STATE);
  const generationRef = useRef(0);
  const executionIdRef = useRef<string | null>(null);
  const subscriptionRef = useRef<WebSocket | null>(null);

  const cancelActiveExecution = useCallback(
    (reason: string) => {
      const executionId = executionIdRef.current;
      executionIdRef.current = null;
      subscriptionRef.current?.close(1000, reason);
      subscriptionRef.current = null;
      if (executionId) void workspace.execution.cancel(executionId, reason);
    },
    [workspace.execution],
  );

  useEffect(() => {
    generationRef.current += 1;
    cancelActiveExecution('Entity selection changed');
    setState(INITIAL_STATE);

    return () => {
      generationRef.current += 1;
      cancelActiveExecution('Request view unmounted');
    };
  }, [cancelActiveExecution, entityId, workspace.id]);

  const execute = useCallback(
    async (entity: GraphqlEntityData) => {
      if (!entityId) return;

      const generation = ++generationRef.current;
      cancelActiveExecution('Superseded by a newer execution');
      const executionId = crypto.randomUUID();
      executionIdRef.current = executionId;
      const isCurrent = () => generationRef.current === generation && executionIdRef.current === executionId;
      const updateState = (update: (previous: RequestState) => RequestState) => {
        setState((previous) => (isCurrent() ? update(previous) : previous));
      };

      const requestBody = entity.requestBody?.value;
      const body: Record<string, unknown> | null =
        requestBody && typeof requestBody === 'object' && !Array.isArray(requestBody)
          ? (requestBody as Record<string, unknown>)
          : null;
      const query = typeof body?.query === 'string' ? body.query : '';
      if (isSubscription(query)) {
        const { interpolate } = useEnvironmentStore.getState();
        const requestUrl = interpolate(entity.url ?? '');
        const url = requestUrl.replace(/^http/, 'ws');
        const variablesText = typeof body?.variables === 'string' ? body.variables : '{}';
        let variables: unknown = {};
        try {
          variables = interpolateJson(JSON.parse(variablesText || '{}'), interpolate);
        } catch {
          setState({ ...INITIAL_STATE, phase: 'error', error: 'GraphQL variables must be valid JSON' });
          return;
        }
        const headers = Object.fromEntries(
          entity.requestHeaders
            .filter((header) => header.enabled && header.key)
            .map((header) => [interpolate(header.key), interpolate(header.value)]),
        );
        setState({ ...INITIAL_STATE, phase: 'sending' });
        try {
          if (!Object.keys(headers).some((name) => name.toLowerCase() === 'cookie')) {
            const cookieHeader = await workspace.cookies.resolve(requestUrl);
            if (cookieHeader) headers.cookie = cookieHeader;
          }
          const socket = new WebSocket(url, 'graphql-transport-ws');
          subscriptionRef.current = socket;
          socket.onopen = () => socket.send(JSON.stringify({ type: 'connection_init', payload: { headers } }));
          socket.onmessage = (event) => {
            if (!isCurrent()) return;
            const message = JSON.parse(String(event.data)) as {
              type: string;
              payload?: { data?: unknown; errors?: GraphqlResponse['errors'] };
            };
            if (message.type === 'connection_ack') {
              socket.send(
                JSON.stringify({
                  id: executionId,
                  type: 'subscribe',
                  payload: { query: interpolate(query), variables },
                }),
              );
            } else if (message.type === 'next' && message.payload) {
              const rawBody = JSON.stringify(message.payload);
              updateState((previous) => ({
                ...previous,
                response: {
                  status: 200,
                  statusText: 'Subscription active',
                  time: 0,
                  headers: {},
                  data: message.payload?.data ?? null,
                  errors: message.payload?.errors ?? null,
                  rawBody,
                  size: new Blob([rawBody]).size,
                  testResults: [],
                },
                error: null,
              }));
            } else if (message.type === 'error') {
              updateState((previous) => ({ ...previous, phase: 'error', error: rawError(message.payload) }));
            }
          };
          socket.onerror = () =>
            updateState((previous) => ({
              ...previous,
              phase: 'error',
              error: 'GraphQL subscription connection failed',
            }));
          socket.onclose = () => {
            if (subscriptionRef.current === socket) subscriptionRef.current = null;
          };
        } catch (error) {
          setState({
            ...INITIAL_STATE,
            phase: 'error',
            error: error instanceof Error ? error.message : 'Subscription failed',
          });
        }
        return;
      }

      const unsubscribe = workspace.manager.yasumu.events.on('onExecutionEvent', (_eventWorkspace, event) => {
        if (!isCurrent() || event.executionId !== executionId) return;
        const output = outputFromExecutionEvent(event);
        updateState((previous) => ({
          ...previous,
          phase: phaseFromExecutionEvent(event, previous.phase),
          scriptOutput: output ? [...previous.scriptOutput, output] : previous.scriptOutput,
          testResults: event.type === 'test-completed' ? [...previous.testResults, event.test] : previous.testResults,
        }));
      });

      const startedAt = performance.now();
      trackEvent('graphql_request_started', {
        workspace_id: workspace.id,
        entity_id: entityId,
        has_script: !!entity.script?.code?.trim(),
      });
      setState({ ...INITIAL_STATE, phase: 'sending' });

      try {
        const result = await workspace.execution.execute({
          entityId,
          executionId,
          environmentId,
          mode: 'test',
        });
        if (!isCurrent()) return;

        const response = graphqlResponseFromExecution(result);
        setState({
          phase: result.status === 'completed' ? 'completed' : result.status === 'cancelled' ? 'cancelled' : 'error',
          response,
          error: result.error?.message ?? (response ? null : 'Execution completed without a response'),
          scriptOutput: outputsFromExecution(result),
          testResults: result.tests,
        });

        if (result.status === 'completed' && response) {
          trackTiming('graphql_request_completed', startedAt, {
            workspace_id: workspace.id,
            entity_id: entityId,
            status: response.status,
            has_errors: !!response.errors?.length,
            test_count: response.testResults.length,
          });
        } else {
          trackTiming('graphql_request_failed', startedAt, {
            workspace_id: workspace.id,
            entity_id: entityId,
            failure_stage: result.status,
          });
        }
      } catch (error) {
        if (!isCurrent()) return;
        setState((previous) => ({
          ...previous,
          phase: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        trackTiming('graphql_request_failed', startedAt, {
          workspace_id: workspace.id,
          entity_id: entityId,
          failure_stage: 'exception',
        });
      } finally {
        unsubscribe();
        if (executionIdRef.current === executionId) executionIdRef.current = null;
      }
    },
    [cancelActiveExecution, entityId, environmentId, workspace],
  );

  const cancel = useCallback(() => {
    generationRef.current += 1;
    cancelActiveExecution('Cancelled by user');
    if (entityId) {
      trackEvent('graphql_request_cancelled', { workspace_id: workspace.id, entity_id: entityId });
    }
    setState((previous) => ({ ...previous, phase: 'cancelled', error: 'Request cancelled' }));
  }, [cancelActiveExecution, entityId, workspace.id]);

  const reset = useCallback(() => {
    generationRef.current += 1;
    cancelActiveExecution('Request reset');
    setState(INITIAL_STATE);
  }, [cancelActiveExecution]);

  return { state, execute, cancel, reset };
}
