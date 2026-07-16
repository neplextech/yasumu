'use client';

import type { RestEntityData, TestResult } from '@yasumu/core';
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
import {
  categorizeContent,
  createBlobUrlFromBuffer,
  createBlobUrlFromText,
  getContentType,
} from '@/components/responses/viewers';
import { trackEvent, trackTiming } from '@/lib/instrumentation/analytics';

import { restResponseFromExecution, type RestResponse } from '../_lib/rest-request';

export type {
  RequestPhase,
  ScriptOutputEntry,
  ScriptOutputType,
} from '@/app/[locale]/workspaces/[workspace]/_lib/headless-execution';

export interface RequestState {
  phase: RequestPhase;
  response: RestResponse | null;
  error: string | null;
  scriptOutput: ScriptOutputEntry[];
  blobUrl: string | null;
  testResults: TestResult[];
}

interface UseRestRequestOptions {
  entityId: string | null;
}

interface UseRestRequestReturn {
  state: RequestState;
  execute: (entity: RestEntityData, pathParams: Record<string, { value: string; enabled: boolean }>) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

const INITIAL_STATE: RequestState = {
  phase: 'idle',
  response: null,
  error: null,
  scriptOutput: [],
  blobUrl: null,
  testResults: [],
};

function createResponseBlobUrl(response: RestResponse): string | null {
  const contentType = getContentType(response.headers);
  const category = categorizeContent(contentType);
  const needsBlobUrl =
    !response.bodyTruncated &&
    (category === 'image' || category === 'video' || category === 'audio' || category === 'pdf');

  if (!needsBlobUrl) return null;
  if (response.binaryBody) return createBlobUrlFromBuffer(response.binaryBody, contentType);
  if (response.textBody) return createBlobUrlFromText(response.textBody, contentType);
  return null;
}

export function useRestRequest({ entityId }: UseRestRequestOptions): UseRestRequestReturn {
  const workspace = useActiveWorkspace();
  const environmentId = useEnvironmentStore((store) => store.selectedEnvironment?.id);
  const [state, setState] = useState<RequestState>(INITIAL_STATE);
  const generationRef = useRef(0);
  const executionIdRef = useRef<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const revokeBlobUrl = useCallback(() => {
    if (!blobUrlRef.current) return;
    URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = null;
  }, []);

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
    revokeBlobUrl();
    setState(INITIAL_STATE);

    return () => {
      generationRef.current += 1;
      cancelActiveExecution('Request view unmounted');
      revokeBlobUrl();
    };
  }, [cancelActiveExecution, entityId, revokeBlobUrl, workspace.id]);

  const execute = useCallback(
    async (entity: RestEntityData, pathParams: Record<string, { value: string; enabled: boolean }>) => {
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
      trackEvent('rest_request_started', {
        workspace_id: workspace.id,
        entity_id: entityId,
        method: entity.method,
        has_script: !!entity.script?.code?.trim(),
      });
      revokeBlobUrl();
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

        const response = restResponseFromExecution(result);
        const blobUrl = response ? createResponseBlobUrl(response) : null;
        revokeBlobUrl();
        blobUrlRef.current = blobUrl;
        setState({
          phase: result.status === 'completed' ? 'completed' : result.status === 'cancelled' ? 'cancelled' : 'error',
          response,
          error: result.error?.message ?? (response ? null : 'Execution completed without a response'),
          scriptOutput: outputsFromExecution(result),
          blobUrl,
          testResults: result.tests,
        });

        if (result.status === 'completed' && response) {
          trackTiming('rest_request_completed', startedAt, {
            workspace_id: workspace.id,
            entity_id: entityId,
            method: entity.method,
            status: response.status,
            body_type: response.bodyType,
          });
        } else {
          trackTiming('rest_request_failed', startedAt, {
            workspace_id: workspace.id,
            entity_id: entityId,
            method: entity.method,
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
        trackTiming('rest_request_failed', startedAt, {
          workspace_id: workspace.id,
          entity_id: entityId,
          method: entity.method,
          failure_stage: 'exception',
        });
      } finally {
        unsubscribe();
        if (executionIdRef.current === executionId) executionIdRef.current = null;
      }
    },
    [cancelActiveExecution, entityId, environmentId, revokeBlobUrl, workspace],
  );

  const cancel = useCallback(() => {
    generationRef.current += 1;
    cancelActiveExecution('Cancelled by user');
    if (entityId) {
      trackEvent('rest_request_cancelled', { workspace_id: workspace.id, entity_id: entityId });
    }
    setState((previous) => ({ ...previous, phase: 'cancelled', error: 'Request cancelled' }));
  }, [cancelActiveExecution, entityId, workspace.id]);

  const reset = useCallback(() => {
    generationRef.current += 1;
    cancelActiveExecution('Request reset');
    revokeBlobUrl();
    setState(INITIAL_STATE);
  }, [cancelActiveExecution, revokeBlobUrl]);

  return { state, execute, cancel, reset };
}
