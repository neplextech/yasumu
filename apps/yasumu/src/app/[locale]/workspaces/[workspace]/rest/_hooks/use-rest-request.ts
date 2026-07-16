'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  isDefaultWorkspacePath,
  type RestEntityData,
  type RestEntityRequestBody,
  type RestScriptContext,
  type TestResult,
} from '@yasumu/core';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  parseScriptMockResponse,
  parseScriptTestResults,
} from '@/app/[locale]/workspaces/[workspace]/_lib/script-result-guards';
import { workspaceQueryKeys } from '@/app/[locale]/workspaces/[workspace]/_lib/workspace-query-keys';
import { useEnvironmentStore } from '@/app/[locale]/workspaces/_stores/environment-store';
import { useActiveWorkspace, useYasumuRuntime } from '@/components/providers/workspace-provider';
import {
  categorizeContent,
  createBlobUrlFromBuffer,
  createBlobUrlFromText,
  getContentType,
} from '@/components/responses/viewers';
import { trackEvent, trackTiming } from '@/lib/instrumentation/analytics';

import { RestRequestController, type RestResponse } from '../_lib/rest-request';

export type RequestPhase =
  | 'idle'
  | 'pre-request-script'
  | 'sending'
  | 'post-response-script'
  | 'completed'
  | 'error'
  | 'cancelled';

export type ScriptOutputType = 'info' | 'success' | 'error' | 'warning' | 'test-pass' | 'test-fail' | 'test-skip';

export interface ScriptOutputEntry {
  message: string;
  type: ScriptOutputType;
  timestamp: number;
}

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

function applyScriptBody(currentBody: RestEntityRequestBody | null, value: unknown): RestEntityRequestBody {
  if (currentBody) return { ...currentBody, value };

  const isFile = typeof File !== 'undefined' && value instanceof File;
  return {
    type: isFile ? 'binary' : typeof value === 'string' ? 'text' : 'json',
    value,
    metadata: {},
  };
}

export function useRestRequest({ entityId }: UseRestRequestOptions): UseRestRequestReturn {
  const workspace = useActiveWorkspace();
  const { echoServerPort } = useYasumuRuntime();
  const interpolate = useEnvironmentStore((store) => store.interpolate);
  const selectedEnvironment = useEnvironmentStore((store) => store.selectedEnvironment);
  const queryClient = useQueryClient();
  const [state, setState] = useState<RequestState>(INITIAL_STATE);
  const controllerRef = useRef<RestRequestController | null>(null);
  const generationRef = useRef(0);
  const blobUrlRef = useRef<string | null>(null);

  if (!controllerRef.current) controllerRef.current = new RestRequestController();

  const revokeBlobUrl = useCallback(() => {
    if (!blobUrlRef.current) return;
    URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = null;
  }, []);

  useEffect(() => {
    generationRef.current += 1;
    controllerRef.current?.cancel();
    revokeBlobUrl();
    setState(INITIAL_STATE);

    return () => {
      generationRef.current += 1;
      controllerRef.current?.cancel();
      revokeBlobUrl();
    };
  }, [entityId, revokeBlobUrl, workspace.id]);

  const execute = useCallback(
    async (_entity: RestEntityData, pathParams: Record<string, { value: string; enabled: boolean }>) => {
      if (!entityId) return;

      const generation = ++generationRef.current;
      const controller = controllerRef.current!;
      controller.cancel();
      const isCurrent = () => generationRef.current === generation;
      const updateState = (update: (previous: RequestState) => RequestState) => {
        setState((previous) => (isCurrent() ? update(previous) : previous));
      };
      const appendOutput = (message: string, type: ScriptOutputType = 'info') => {
        updateState((previous) => ({
          ...previous,
          scriptOutput: [...previous.scriptOutput, { message, type, timestamp: Date.now() }],
        }));
      };
      const commitResponse = (response: RestResponse) => {
        const blobUrl = createResponseBlobUrl(response);
        if (!isCurrent()) {
          if (blobUrl) URL.revokeObjectURL(blobUrl);
          return;
        }

        revokeBlobUrl();
        blobUrlRef.current = blobUrl;
        updateState((previous) => ({ ...previous, response, blobUrl }));
      };

      const startedAt = performance.now();
      trackEvent('rest_request_started', {
        workspace_id: workspace.id,
        entity_id: entityId,
        method: _entity.method,
        has_script: !!_entity.script?.code?.trim(),
      });

      revokeBlobUrl();
      updateState(() => INITIAL_STATE);

      try {
        const freshEntity = await workspace.rest.get(entityId);
        if (!isCurrent()) return;
        const entity = freshEntity?.data ?? _entity;

        const interpolateValue = (value: string) => interpolate(value);
        const interpolatedUrl = interpolateValue(entity.url || '');
        const interpolatedHeaders = Object.fromEntries(
          (entity.requestHeaders || [])
            .filter((header) => header.enabled && header.key)
            .map((header) => [interpolateValue(header.key), interpolateValue(header.value)]),
        );
        const interpolatedBody =
          typeof entity.requestBody?.value === 'string'
            ? interpolateValue(entity.requestBody.value)
            : (entity.requestBody?.value ?? null);
        const interpolatedParams = Object.fromEntries(
          Object.entries(pathParams)
            .filter(([, value]) => value.enabled)
            .map(([key, value]) => [key, interpolateValue(value.value)]),
        );

        let currentContext: RestScriptContext = {
          environment: selectedEnvironment?.toJSON() ?? null,
          request: {
            url: interpolatedUrl,
            method: entity.method,
            headers: interpolatedHeaders,
            body: interpolatedBody,
            parameters: interpolatedParams,
          },
          response: null,
          workspace: {
            id: workspace.id,
            name: workspace.name,
            path: isDefaultWorkspacePath(workspace.path) ? null : workspace.path,
          },
        };

        let mockResponse: RestResponse | null = null;

        if (entity.script?.code?.trim()) {
          updateState((previous) => ({ ...previous, phase: 'pre-request-script' }));
          appendOutput('[Pre-Request] Executing script...');

          try {
            const result = await workspace.rest.executeScript(entityId, entity.script, currentContext);
            if (!isCurrent()) return;

            if (result.result.success) {
              currentContext = result.context;
              appendOutput('[Pre-Request] Script completed successfully', 'success');

              if (result.result.result) {
                const mockData = parseScriptMockResponse(result.result.result);
                if (mockData) {
                  const body =
                    typeof mockData.body === 'string' ? mockData.body : (JSON.stringify(mockData.body) ?? '');
                  mockResponse = {
                    status: mockData.status,
                    statusText: mockData.statusText,
                    headers: mockData.headers,
                    cookies: [],
                    textBody: body,
                    binaryBody: null,
                    bodyType: 'text',
                    time: 0,
                    size: new Blob([body]).size,
                    bodyTruncated: false,
                  };
                  appendOutput('[Pre-Request] Mock response returned, skipping HTTP request', 'warning');
                } else {
                  appendOutput('[Pre-Request] Ignored an invalid mock response', 'warning');
                }
              }
            } else {
              appendOutput(`[Pre-Request] Script failed: ${result.result.error}`, 'error');
            }
          } catch (error) {
            if (!isCurrent()) return;
            appendOutput(
              `[Pre-Request] Script error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              'error',
            );
          }
        }

        if (!isCurrent()) return;
        let response: RestResponse;

        if (mockResponse) {
          response = mockResponse;
          commitResponse(response);
        } else {
          updateState((previous) => ({ ...previous, phase: 'sending' }));

          const contextBody = currentContext.request.body;
          const modifiedEntity: RestEntityData = {
            ...entity,
            url: currentContext.request.url,
            method: currentContext.request.method,
            requestHeaders: Object.entries(currentContext.request.headers).map(([key, value]) => ({
              key,
              value,
              enabled: true,
            })),
            requestBody:
              contextBody === null || contextBody === undefined
                ? entity.requestBody
                : applyScriptBody(entity.requestBody, contextBody),
          };
          const modifiedPathParams = Object.fromEntries(
            Object.entries(currentContext.request.parameters).map(([key, value]) => [key, { value, enabled: true }]),
          );
          const outcome = await controller.execute({
            entity: modifiedEntity,
            pathParams: modifiedPathParams,
            echoServerPort,
            interpolate,
          });

          if (!isCurrent()) return;
          if (!outcome.response) {
            updateState((previous) => ({ ...previous, phase: 'error', error: outcome.error }));
            trackTiming('rest_request_failed', startedAt, {
              workspace_id: workspace.id,
              entity_id: entityId,
              method: entity.method,
              failure_stage: 'request',
            });
            return;
          }

          response = outcome.response;
          commitResponse(response);
        }

        if (entity.script?.code?.trim()) {
          if (!isCurrent()) return;
          const canSendBodyToScript = !response.bodyTruncated && response.bodyType === 'text';
          updateState((previous) => ({ ...previous, phase: 'post-response-script' }));
          appendOutput('[Post-Response] Executing onResponse...');

          if (!canSendBodyToScript) {
            appendOutput('[Post-Response] Response body not available to script (binary or too large)', 'warning');
          }

          const responseContext: RestScriptContext = {
            ...currentContext,
            response: {
              status: response.status,
              headers: response.headers,
              body: canSendBodyToScript ? (response.textBody ?? '') : null,
            },
          };

          try {
            const result = await workspace.rest.executeScript(entityId, entity.script, responseContext);
            if (!isCurrent()) return;

            if (result.result.success) {
              appendOutput('[Post-Response] Script completed successfully', 'success');
              if (selectedEnvironment && result.context.environment) {
                const environment = result.context.environment;
                await selectedEnvironment.update({
                  variables: environment.variables,
                  secrets: environment.secrets,
                });
                await Promise.all([
                  queryClient.invalidateQueries({
                    queryKey: workspaceQueryKeys.environments(workspace.id),
                  }),
                  queryClient.invalidateQueries({
                    queryKey: workspaceQueryKeys.activeEnvironment(workspace.id),
                  }),
                ]);
                if (!isCurrent()) return;
              }
            } else {
              appendOutput(`[Post-Response] Script failed: ${result.result.error}`, 'error');
            }
          } catch (error) {
            if (!isCurrent()) return;
            appendOutput(
              `[Post-Response] Script error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              'error',
            );
          }
        }

        if (entity.script?.code?.trim()) {
          if (!isCurrent()) return;
          const canSendBodyToTest = !response.bodyTruncated && response.bodyType === 'text';
          appendOutput('[Test] Running tests...');
          const testContext: RestScriptContext = {
            ...currentContext,
            response: {
              status: response.status,
              headers: response.headers,
              body: canSendBodyToTest ? (response.textBody ?? '') : null,
            },
          };

          try {
            const testResult = await workspace.rest.executeTest(entityId, entity.script, testContext);
            if (!isCurrent()) return;

            if (testResult.result.success) {
              const results = parseScriptTestResults(testResult.result.result);
              if (results && results.length > 0) {
                updateState((previous) => ({ ...previous, testResults: results }));
                const passed = results.filter((result) => result.result === 'pass').length;
                const failed = results.filter((result) => result.result === 'fail').length;
                const skipped = results.filter((result) => result.result === 'skip').length;
                const type = failed > 0 ? 'test-fail' : skipped > 0 && passed === 0 ? 'test-skip' : 'test-pass';
                appendOutput(`[Test] ${passed} passed, ${failed} failed, ${skipped} skipped`, type);
              } else if (results === null && testResult.result.result != null) {
                appendOutput('[Test] Ignored an invalid test result', 'warning');
              } else {
                appendOutput('[Test] No tests defined');
              }
            } else {
              appendOutput(`[Test] Failed: ${testResult.result.error}`, 'error');
            }
          } catch (error) {
            if (!isCurrent()) return;
            appendOutput(`[Test] Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
          }
        }

        if (!isCurrent()) return;
        updateState((previous) => ({ ...previous, phase: 'completed' }));
        trackTiming('rest_request_completed', startedAt, {
          workspace_id: workspace.id,
          entity_id: entityId,
          method: entity.method,
          status: response.status,
          body_type: response.bodyType,
        });
      } catch (error) {
        if (!isCurrent()) return;
        updateState((previous) => ({
          ...previous,
          phase: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        trackTiming('rest_request_failed', startedAt, {
          workspace_id: workspace.id,
          entity_id: entityId,
          method: _entity.method,
          failure_stage: 'exception',
        });
      }
    },
    [echoServerPort, entityId, interpolate, queryClient, revokeBlobUrl, selectedEnvironment, workspace],
  );

  const cancel = useCallback(() => {
    generationRef.current += 1;
    controllerRef.current?.cancel();
    if (entityId) {
      trackEvent('rest_request_cancelled', {
        workspace_id: workspace.id,
        entity_id: entityId,
      });
    }
    setState((previous) => ({ ...previous, phase: 'cancelled', error: 'Request cancelled' }));
  }, [entityId, workspace.id]);

  const reset = useCallback(() => {
    generationRef.current += 1;
    controllerRef.current?.cancel();
    revokeBlobUrl();
    setState(INITIAL_STATE);
  }, [revokeBlobUrl]);

  return { state, execute, cancel, reset };
}
