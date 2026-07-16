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

export type { RequestPhase, ScriptOutputEntry, ScriptOutputType } from '@/app/[locale]/workspaces/[workspace]/_lib/headless-execution';

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
