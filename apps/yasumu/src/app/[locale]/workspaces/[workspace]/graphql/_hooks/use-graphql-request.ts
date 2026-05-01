'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import type {
  GraphqlEntityData,
  GraphqlScriptContext,
  TestResult,
} from '@yasumu/core';
import { getGraphqlBodyValue } from './use-graphql-entity';
import { isDefaultWorkspacePath } from '@yasumu/tanxium/src/rpc/common/constants';
import { trackEvent, trackTiming } from '@/lib/instrumentation/analytics';

function extractTestResultsFromResponse(
  response: GraphqlResponse,
): TestResult[] {
  return response.testResults ?? [];
}

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

  // Reset request state when switching entities
  useEffect(() => {
    setState(INITIAL_STATE);
  }, [entityId]);

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

      const startedAt = performance.now();
      trackEvent('graphql_request_started', {
        workspace_id: workspace.id,
        entity_id: entityId,
        has_script: !!_entity.script?.code?.trim(),
      });

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
          entity = freshEntity.data;
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
      let interpolatedUrl = interpolateValue(entity.url || '');
      let interpolatedHeaders = Object.fromEntries(
        (entity.requestHeaders || [])
          .filter((h) => h.enabled && h.key)
          .map((h) => [interpolateValue(h.key), interpolateValue(h.value)]),
      );
      const bodyValue = getGraphqlBodyValue(entity.requestBody);
      const interpolatedQuery = bodyValue.query
        ? interpolateValue(bodyValue.query)
        : '';
      const interpolatedVariables = bodyValue.variables
        ? interpolateValue(bodyValue.variables)
        : null;

      let currentContext: GraphqlScriptContext = {
        environment: selectedEnvironment?.toJSON() ?? null,
        request: {
          url: interpolatedUrl,
          headers: interpolatedHeaders,
          body: {
            query: interpolatedQuery,
            variables: interpolatedVariables,
          },
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

      try {
        // === Pre-request script execution ===
        if (entity.script?.code?.trim()) {
          setState((prev) => ({ ...prev, phase: 'pre-request-script' }));
          appendScriptOutput('[Pre-Request] Executing script...', 'info');

          try {
            const result = await graphql.executeScript(
              entityId,
              entity.script,
              currentContext,
            );

            if (result.result.success) {
              currentContext = result.context;
              // Apply script-modified context back to request params
              interpolatedUrl = currentContext.request.url;
              interpolatedHeaders = currentContext.request.headers;

              appendScriptOutput(
                '[Pre-Request] Script completed successfully',
                'success',
              );

              if (result.result.result) {
                const mockData = result.result.result as {
                  status: number;
                  statusText: string;
                  headers: Record<string, string>;
                  body: unknown;
                };
                const bodyStr =
                  typeof mockData.body === 'string'
                    ? mockData.body
                    : JSON.stringify(mockData.body);
                mockResponse = {
                  status: mockData.status,
                  statusText: mockData.statusText,
                  headers: mockData.headers,
                  rawBody: bodyStr,
                  data: null,
                  errors: null,
                  time: 0,
                  size: new Blob([bodyStr]).size,
                  testResults: [],
                };
                appendScriptOutput(
                  '[Pre-Request] Mock response returned, skipping HTTP request',
                  'warning',
                );
              }
            } else {
              appendScriptOutput(
                `[Pre-Request] Script failed: ${result.result.error}`,
                'error',
              );
            }
          } catch (err) {
            appendScriptOutput(
              `[Pre-Request] Script error: ${err instanceof Error ? err.message : 'Unknown error'}`,
              'error',
            );
          }
        }

        if (isCancelledRef.current) {
          setState((prev) => ({ ...prev, phase: 'cancelled' }));
          return;
        }

        let response: GraphqlResponse;

        if (mockResponse) {
          response = mockResponse;
          setState((prev) => ({ ...prev, response }));
        } else {
          setState((prev) => ({ ...prev, phase: 'sending' }));

          const outcome = await controllerRef.current.execute({
            url: interpolatedUrl,
            query: interpolatedQuery,
            variables: interpolatedVariables,
            operationName: /* bodyValue.operationName || */ null,
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
            trackTiming('graphql_request_failed', startedAt, {
              workspace_id: workspace.id,
              entity_id: entityId,
              failure_stage: 'request',
            });
            return;
          }

          response = outcome.response!;
          setState((prev) => ({ ...prev, response }));
        }

        // === Post-response script execution ===
        if (entity.script?.code?.trim()) {
          setState((prev) => ({ ...prev, phase: 'post-response-script' }));
          appendScriptOutput('[Post-Response] Executing onResponse...', 'info');

          const responseContext: GraphqlScriptContext = {
            ...currentContext,
            response: {
              status: response.status,
              headers: response.headers,
              body: response.rawBody ?? '',
            },
          };

          try {
            const result = await graphql.executeScript(
              entityId,
              entity.script,
              responseContext,
            );

            if (result.result.success) {
              appendScriptOutput(
                '[Post-Response] Script completed successfully',
                'success',
              );

              if (selectedEnvironment && result.context.environment) {
                const envData = result.context.environment;
                await selectedEnvironment.update({
                  variables: envData.variables,
                  secrets: envData.secrets,
                });
                await queryClient.invalidateQueries({
                  queryKey: ['environments'],
                });
                await queryClient.invalidateQueries({
                  queryKey: ['currentEnvironment'],
                });
              }
            } else {
              appendScriptOutput(
                `[Post-Response] Script failed: ${result.result.error}`,
                'error',
              );
            }
          } catch (err) {
            appendScriptOutput(
              `[Post-Response] Script error: ${err instanceof Error ? err.message : 'Unknown error'}`,
              'error',
            );
          }
        }

        // === Test execution ===
        if (entity.script?.code?.trim()) {
          appendScriptOutput('[Test] Running tests...', 'info');

          const testContext: GraphqlScriptContext = {
            ...currentContext,
            response: {
              status: response.status,
              headers: response.headers,
              body: response.rawBody ?? '',
            },
          };

          try {
            const testResult = await graphql.executeTest(
              entityId,
              entity.script,
              testContext,
            );

            if (testResult.result.success) {
              const results = testResult.result.result as {
                testResults: TestResult[];
              };
              if (results?.testResults?.length > 0) {
                setState((prev) => ({
                  ...prev,
                  testResults: results.testResults,
                }));
                const passed = results.testResults.filter(
                  (r) => r.result === 'pass',
                ).length;
                const failed = results.testResults.filter(
                  (r) => r.result === 'fail',
                ).length;
                const skipped = results.testResults.filter(
                  (r) => r.result === 'skip',
                ).length;

                if (failed > 0) {
                  appendScriptOutput(
                    `[Test] ${passed} passed, ${failed} failed, ${skipped} skipped`,
                    'test-fail',
                  );
                } else if (skipped > 0 && passed === 0) {
                  appendScriptOutput(
                    `[Test] ${passed} passed, ${failed} failed, ${skipped} skipped`,
                    'test-skip',
                  );
                } else {
                  appendScriptOutput(
                    `[Test] ${passed} passed, ${failed} failed, ${skipped} skipped`,
                    'test-pass',
                  );
                }
              } else {
                const responseTestResults =
                  extractTestResultsFromResponse(response);

                if (responseTestResults.length > 0) {
                  setState((prev) => ({
                    ...prev,
                    testResults: responseTestResults,
                  }));
                  appendScriptOutput(
                    `[Test] Loaded ${responseTestResults.length} test result(s) from response`,
                    'info',
                  );
                } else {
                  appendScriptOutput('[Test] No tests defined', 'info');
                }
              }
            } else {
              appendScriptOutput(
                `[Test] Failed: ${testResult.result.error}`,
                'error',
              );
            }
          } catch (err) {
            appendScriptOutput(
              `[Test] Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
              'error',
            );

            const responseTestResults =
              extractTestResultsFromResponse(response);
            if (responseTestResults.length > 0) {
              setState((prev) => ({
                ...prev,
                testResults: responseTestResults,
              }));
              appendScriptOutput(
                `[Test] Loaded ${responseTestResults.length} test result(s) from response`,
                'info',
              );
            }
          }
        } else {
          const responseTestResults = extractTestResultsFromResponse(response);
          if (responseTestResults.length > 0) {
            setState((prev) => ({
              ...prev,
              testResults: responseTestResults,
            }));
            appendScriptOutput(
              `[Test] Loaded ${responseTestResults.length} test result(s) from response`,
              'info',
            );
          }
        }

        setState((prev) => ({ ...prev, phase: 'completed' }));
        trackTiming('graphql_request_completed', startedAt, {
          workspace_id: workspace.id,
          entity_id: entityId,
          status: response.status,
          has_errors: !!response.errors?.length,
          test_count: extractTestResultsFromResponse(response).length,
        });
      } catch (err) {
        if (!isCancelledRef.current) {
          setState((prev) => ({
            ...prev,
            phase: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          }));
          trackTiming('graphql_request_failed', startedAt, {
            workspace_id: workspace.id,
            entity_id: entityId,
            failure_stage: 'exception',
          });
        }
      }
    },
    [
      entityId,
      workspace,
      echoServerPort,
      interpolate,
      appendScriptOutput,
      selectedEnvironment,
      queryClient,
    ],
  );

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
    controllerRef.current.cancel();
    if (entityId) {
      trackEvent('graphql_request_cancelled', {
        workspace_id: workspace.id,
        entity_id: entityId,
      });
    }
    setState((prev) => ({
      ...prev,
      phase: 'cancelled',
      error: 'Request cancelled',
    }));
  }, [entityId, workspace.id]);

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
