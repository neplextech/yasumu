'use client';

import type { SseEntityData, SseEvent, TestResult } from '@yasumu/core';
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

export type { RequestPhase, ScriptOutputEntry } from '@/app/[locale]/workspaces/[workspace]/_lib/headless-execution';

export interface SseConnectionResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  reconnects: number;
}

export interface SseRequestState {
  phase: RequestPhase;
  connected: boolean;
  response: SseConnectionResponse | null;
  events: SseEvent[];
  error: string | null;
  scriptOutput: ScriptOutputEntry[];
  testResults: TestResult[];
}

const INITIAL_STATE: SseRequestState = {
  phase: 'idle',
  connected: false,
  response: null,
  events: [],
  error: null,
  scriptOutput: [],
  testResults: [],
};

export function useSseRequest({ entityId }: { entityId: string | null }) {
  const workspace = useActiveWorkspace();
  const environmentId = useEnvironmentStore((store) => store.selectedEnvironment?.id);
  const [state, setState] = useState<SseRequestState>(INITIAL_STATE);
  const generationRef = useRef(0);
  const executionIdRef = useRef<string | null>(null);

  const cancelActiveExecution = useCallback(
    (reason: string) => {
      const executionId = executionIdRef.current;
      executionIdRef.current = null;
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
      cancelActiveExecution('SSE view unmounted');
    };
  }, [cancelActiveExecution, entityId, workspace.id]);

  const execute = useCallback(
    async (entity: SseEntityData, pathParams: Record<string, { value: string; enabled: boolean }>) => {
      if (!entityId) return;
      const generation = ++generationRef.current;
      cancelActiveExecution('Superseded by a newer SSE connection');
      const executionId = crypto.randomUUID();
      executionIdRef.current = executionId;
      const isCurrent = () => generationRef.current === generation && executionIdRef.current === executionId;
      const update = (updater: (previous: SseRequestState) => SseRequestState) => {
        setState((previous) => (isCurrent() ? updater(previous) : previous));
      };

      const unsubscribe = workspace.manager.yasumu.events.on('onExecutionEvent', (_eventWorkspace, event) => {
        if (!isCurrent() || event.executionId !== executionId) return;
        const output = outputFromExecutionEvent(event);
        update((previous) => {
          if (event.type === 'sse-opened') {
            return {
              ...previous,
              phase: 'sending',
              connected: event.status >= 200 && event.status < 300,
              response: {
                status: event.status,
                statusText: event.statusText,
                headers: Object.fromEntries(event.headers),
                reconnects: (previous.response?.reconnects ?? 0) + (event.reconnected ? 1 : 0),
              },
            };
          }
          if (event.type === 'sse-event-received') {
            return { ...previous, connected: true, events: [...previous.events, event.event] };
          }
          return {
            ...previous,
            phase: phaseFromExecutionEvent(event, previous.phase),
            scriptOutput: output ? [...previous.scriptOutput, output] : previous.scriptOutput,
            testResults: event.type === 'test-completed' ? [...previous.testResults, event.test] : previous.testResults,
          };
        });
      });

      const startedAt = performance.now();
      trackEvent('sse_connection_started', {
        workspace_id: workspace.id,
        entity_id: entityId,
        method: entity.method,
        reconnect: entity.reconnect.enabled,
      });
      setState({ ...INITIAL_STATE, phase: 'sending' });

      try {
        const result = await workspace.execution.execute({
          entityId,
          executionId,
          environmentId,
          mode: 'test',
          pathParameters: Object.fromEntries(
            Object.entries(pathParams)
              .filter(([, parameter]) => parameter.enabled)
              .map(([key, parameter]) => [key, parameter.value]),
          ),
        });
        if (!isCurrent()) return;
        const response = result.response;
        setState((previous) => ({
          phase: result.status === 'completed' ? 'completed' : result.status === 'cancelled' ? 'cancelled' : 'error',
          connected: false,
          response:
            previous.response ??
            (response
              ? {
                  status: response.status,
                  statusText: response.statusText,
                  headers: Object.fromEntries(response.headers),
                  reconnects: 0,
                }
              : null),
          events: result.events,
          error: result.error?.message ?? null,
          scriptOutput: outputsFromExecution(result),
          testResults: result.tests,
        }));
        trackTiming(result.status === 'completed' ? 'sse_connection_completed' : 'sse_connection_failed', startedAt, {
          workspace_id: workspace.id,
          entity_id: entityId,
          events: result.events.length,
          status: result.status,
        });
      } catch (error) {
        if (!isCurrent()) return;
        setState((previous) => ({
          ...previous,
          phase: 'error',
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown SSE error',
        }));
      } finally {
        unsubscribe();
        if (executionIdRef.current === executionId) executionIdRef.current = null;
      }
    },
    [cancelActiveExecution, entityId, environmentId, workspace],
  );

  const cancel = useCallback(() => {
    generationRef.current += 1;
    cancelActiveExecution('SSE connection closed by user');
    if (entityId) trackEvent('sse_connection_cancelled', { workspace_id: workspace.id, entity_id: entityId });
    setState((previous) => ({ ...previous, phase: 'cancelled', connected: false, error: null }));
  }, [cancelActiveExecution, entityId, workspace.id]);

  const clearEvents = useCallback(() => setState((previous) => ({ ...previous, events: [] })), []);
  return { state, execute, cancel, clearEvents };
}
