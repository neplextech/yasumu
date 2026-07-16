'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  isDefaultWorkspacePath,
  type GraphqlEntityData,
  type GraphqlScriptContext,
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
import { trackEvent, trackTiming } from '@/lib/instrumentation/analytics';

import { GraphqlRequestController, type GraphqlResponse } from '../_lib/graphql-request';
import { getGraphqlBodyValue } from './use-graphql-entity';

function extractTestResultsFromResponse(response: GraphqlResponse): TestResult[] {
  return response.testResults ?? [];
}

interface ExecutableGraphqlBody {
  query: string;
  variables: string | null;
  operationName: string | null;
}

function normalizeScriptBody(body: unknown, fallback: ExecutableGraphqlBody): ExecutableGraphqlBody {
  if (!body || typeof body !== 'object') return fallback;
  const value = body as Record<string, unknown>;

  let variables = fallback.variables;
  if (value.variables === null) {
    variables = null;
  } else if (typeof value.variables === 'string') {
    variables = value.variables;
  } else if (value.variables !== undefined) {
    variables = JSON.stringify(value.variables) ?? fallback.variables;
  }

  return {
    query: typeof value.query === 'string' ? value.query : fallback.query,
    variables,
    operationName:
      value.operationName === null
        ? null
        : typeof value.operationName === 'string'
          ? value.operationName
          : fallback.operationName,
  };
}

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
  const { echoServerPort } = useYasumuRuntime();
  const interpolate = useEnvironmentStore((store) => store.interpolate);
  const selectedEnvironment = useEnvironmentStore((store) => store.selectedEnvironment);
  const queryClient = useQueryClient();
  const [state, setState] = useState<RequestState>(INITIAL_STATE);
  const controllerRef = useRef<GraphqlRequestController | null>(null);
  const generationRef = useRef(0);
  const graphql = workspace.graphql;

  if (!controllerRef.current) controllerRef.current = new GraphqlRequestController();

  useEffect(() => {
    generationRef.current += 1;
    controllerRef.current?.cancel();
    setState(INITIAL_STATE);

    return () => {
      generationRef.current += 1;
      controllerRef.current?.cancel();
    };
  }, [entityId, workspace.id]);

  const execute = useCallback(
    async (_entity: GraphqlEntityData) => {
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

      const startedAt = performance.now();
      trackEvent('graphql_request_started', {
        workspace_id: workspace.id,
        entity_id: entityId,
        has_script: !!_entity.script?.code?.trim(),
      });
      updateState(() => INITIAL_STATE);

      try {
        const freshEntity = await graphql.get(entityId);
        if (!isCurrent()) return;
        const entity = freshEntity?.data ?? _entity;
        const bodyValue = getGraphqlBodyValue(entity.requestBody);
        const interpolateValue = (value: string) => interpolate(value);

        let requestUrl = interpolateValue(entity.url || '');
        let requestHeaders = Object.fromEntries(
          (entity.requestHeaders || [])
            .filter((header) => header.enabled && header.key)
            .map((header) => [interpolateValue(header.key), interpolateValue(header.value)]),
        );
        let requestBody: ExecutableGraphqlBody = {
          query: interpolateValue(bodyValue.query || ''),
          variables: bodyValue.variables ? interpolateValue(bodyValue.variables) : null,
          operationName: bodyValue.operationName ? interpolateValue(bodyValue.operationName) : null,
        };

        let currentContext: GraphqlScriptContext = {
          environment: selectedEnvironment?.toJSON() ?? null,
          request: {
            url: requestUrl,
            headers: requestHeaders,
            body: requestBody,
            parameters: {},
          },
          response: null,
          workspace: {
            id: workspace.id,
            name: workspace.name,
            path: isDefaultWorkspacePath(workspace.path) ? null : workspace.path,
          },
        };
        let mockResponse: GraphqlResponse | null = null;

        if (entity.script?.code?.trim()) {
          updateState((previous) => ({ ...previous, phase: 'pre-request-script' }));
          appendOutput('[Pre-Request] Executing script...');

          try {
            const result = await graphql.executeScript(entityId, entity.script, currentContext);
            if (!isCurrent()) return;

            if (result.result.success) {
              currentContext = result.context;
              requestUrl = interpolateValue(currentContext.request.url);
              requestHeaders = Object.fromEntries(
                Object.entries(currentContext.request.headers).map(([key, value]) => [
                  interpolateValue(key),
                  interpolateValue(value),
                ]),
              );
              const scriptBody = normalizeScriptBody(currentContext.request.body, requestBody);
              requestBody = {
                query: interpolateValue(scriptBody.query),
                variables: scriptBody.variables === null ? null : interpolateValue(scriptBody.variables),
                operationName: scriptBody.operationName === null ? null : interpolateValue(scriptBody.operationName),
              };
              currentContext = {
                ...currentContext,
                request: {
                  ...currentContext.request,
                  url: requestUrl,
                  headers: requestHeaders,
                  body: requestBody,
                },
              };

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
                    rawBody: body,
                    data: null,
                    errors: null,
                    time: 0,
                    size: new Blob([body]).size,
                    testResults: [],
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
        let response: GraphqlResponse;

        if (mockResponse) {
          response = mockResponse;
          updateState((previous) => ({ ...previous, response }));
        } else {
          updateState((previous) => ({ ...previous, phase: 'sending' }));
          const outcome = await controller.execute({
            url: requestUrl,
            query: requestBody.query,
            variables: requestBody.variables,
            operationName: requestBody.operationName,
            headers: requestHeaders,
            echoServerPort,
            interpolate,
          });

          if (!isCurrent()) return;
          if (!outcome.response) {
            updateState((previous) => ({ ...previous, phase: 'error', error: outcome.error }));
            trackTiming('graphql_request_failed', startedAt, {
              workspace_id: workspace.id,
              entity_id: entityId,
              failure_stage: 'request',
            });
            return;
          }

          response = outcome.response;
          updateState((previous) => ({ ...previous, response }));
        }

        if (entity.script?.code?.trim()) {
          if (!isCurrent()) return;
          updateState((previous) => ({ ...previous, phase: 'post-response-script' }));
          appendOutput('[Post-Response] Executing onResponse...');
          const responseContext: GraphqlScriptContext = {
            ...currentContext,
            response: {
              status: response.status,
              headers: response.headers,
              body: response.rawBody ?? '',
            },
          };

          try {
            const result = await graphql.executeScript(entityId, entity.script, responseContext);
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
          appendOutput('[Test] Running tests...');
          const testContext: GraphqlScriptContext = {
            ...currentContext,
            response: {
              status: response.status,
              headers: response.headers,
              body: response.rawBody ?? '',
            },
          };

          try {
            const testResult = await graphql.executeTest(entityId, entity.script, testContext);
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
                const responseResults = extractTestResultsFromResponse(response);
                if (responseResults.length > 0) {
                  updateState((previous) => ({ ...previous, testResults: responseResults }));
                  appendOutput(`[Test] Loaded ${responseResults.length} test result(s) from response`);
                } else {
                  appendOutput('[Test] No tests defined');
                }
              }
            } else {
              appendOutput(`[Test] Failed: ${testResult.result.error}`, 'error');
            }
          } catch (error) {
            if (!isCurrent()) return;
            appendOutput(`[Test] Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            const responseResults = extractTestResultsFromResponse(response);
            if (responseResults.length > 0) {
              updateState((previous) => ({ ...previous, testResults: responseResults }));
              appendOutput(`[Test] Loaded ${responseResults.length} test result(s) from response`);
            }
          }
        } else {
          const responseResults = extractTestResultsFromResponse(response);
          if (responseResults.length > 0) {
            updateState((previous) => ({ ...previous, testResults: responseResults }));
            appendOutput(`[Test] Loaded ${responseResults.length} test result(s) from response`);
          }
        }

        if (!isCurrent()) return;
        updateState((previous) => ({ ...previous, phase: 'completed' }));
        trackTiming('graphql_request_completed', startedAt, {
          workspace_id: workspace.id,
          entity_id: entityId,
          status: response.status,
          has_errors: !!response.errors?.length,
          test_count: extractTestResultsFromResponse(response).length,
        });
      } catch (error) {
        if (!isCurrent()) return;
        updateState((previous) => ({
          ...previous,
          phase: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        trackTiming('graphql_request_failed', startedAt, {
          workspace_id: workspace.id,
          entity_id: entityId,
          failure_stage: 'exception',
        });
      }
    },
    [echoServerPort, entityId, graphql, interpolate, queryClient, selectedEnvironment, workspace],
  );

  const cancel = useCallback(() => {
    generationRef.current += 1;
    controllerRef.current?.cancel();
    if (entityId) {
      trackEvent('graphql_request_cancelled', {
        workspace_id: workspace.id,
        entity_id: entityId,
      });
    }
    setState((previous) => ({ ...previous, phase: 'cancelled', error: 'Request cancelled' }));
  }, [entityId, workspace.id]);

  const reset = useCallback(() => {
    generationRef.current += 1;
    controllerRef.current?.cancel();
    setState(INITIAL_STATE);
  }, []);

  return { state, execute, cancel, reset };
}
