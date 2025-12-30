'use client';

import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useActiveWorkspace,
  useYasumu,
} from '@/components/providers/workspace-provider';
import { useEnvironmentStore } from '@/app/[locale]/workspaces/_stores/environment-store';
import {
  RestRequestController,
  RestResponse,
  type RestRequestOutcome,
} from '../_lib/rest-request';
import type { RestEntityData, RestScriptContext } from '@yasumu/common';
import {
  getContentType,
  categorizeContent,
  createBlobUrlFromBuffer,
  createBlobUrlFromText,
} from '@/components/responses/viewers';

export type RequestPhase =
  | 'idle'
  | 'pre-request-script'
  | 'sending'
  | 'post-response-script'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface RequestState {
  phase: RequestPhase;
  response: RestResponse | null;
  error: string | null;
  scriptOutput: string[];
  blobUrl: string | null;
}

interface UseRestRequestOptions {
  entityId: string | null;
}

interface UseRestRequestReturn {
  state: RequestState;
  execute: (
    entity: RestEntityData,
    pathParams: Record<string, { value: string; enabled: boolean }>,
  ) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

const INITIAL_STATE: RequestState = {
  phase: 'idle',
  response: null,
  error: null,
  scriptOutput: [],
  blobUrl: null,
};

function createResponseBlobUrl(response: RestResponse): string | null {
  const contentType = getContentType(response.headers);
  const category = categorizeContent(contentType);

  const needsBlobUrl =
    !response.bodyTruncated &&
    (category === 'image' ||
      category === 'video' ||
      category === 'audio' ||
      category === 'pdf');

  if (!needsBlobUrl) return null;

  if (response.binaryBody) {
    return createBlobUrlFromBuffer(response.binaryBody, contentType);
  }
  if (response.textBody) {
    return createBlobUrlFromText(response.textBody, contentType);
  }
  return null;
}

export function useRestRequest({
  entityId,
}: UseRestRequestOptions): UseRestRequestReturn {
  const workspace = useActiveWorkspace();
  const { echoServerPort } = useYasumu();
  const { interpolate } = useEnvironmentStore();
  const [state, setState] = useState<RequestState>(INITIAL_STATE);
  const controllerRef = useRef(new RestRequestController());
  const isCancelledRef = useRef(false);
  const { selectedEnvironment } = useEnvironmentStore();
  const queryClient = useQueryClient();

  const appendScriptOutput = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      scriptOutput: [...prev.scriptOutput, message],
    }));
  }, []);

  const execute = useCallback(
    async (
      _entity: RestEntityData,
      pathParams: Record<string, { value: string; enabled: boolean }>,
    ) => {
      if (!entityId) return;

      isCancelledRef.current = false;
      setState((prev) => {
        if (prev.blobUrl) {
          URL.revokeObjectURL(prev.blobUrl);
        }
        return {
          phase: 'idle',
          response: null,
          error: null,
          scriptOutput: [],
          blobUrl: null,
        };
      });

      const freshEntity = (await workspace.rest.get(entityId)) ?? _entity;
      if (!freshEntity) {
        setState((prev) => ({
          ...prev,
          phase: 'error',
          error: 'Entity not found',
        }));
        return;
      }

      const entity = freshEntity.data;

      const interpolateValue = (value: string) => interpolate(value);
      const interpolatedUrl = interpolateValue(entity.url || '');
      const interpolatedHeaders = Object.fromEntries(
        (entity.requestHeaders || [])
          .filter((h) => h.enabled && h.key)
          .map((h) => [interpolateValue(h.key), interpolateValue(h.value)]),
      );
      const interpolatedBody =
        typeof entity.requestBody?.value === 'string'
          ? interpolateValue(entity.requestBody.value)
          : (entity.requestBody?.value ?? null);
      const interpolatedParams = Object.fromEntries(
        Object.entries(pathParams)
          .filter(([, v]) => v.enabled)
          .map(([k, v]) => [k, interpolateValue(v.value)]),
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
      };

      let mockResponse: RestResponse | null = null;

      try {
        if (entity.script?.code?.trim()) {
          setState((prev) => ({ ...prev, phase: 'pre-request-script' }));
          appendScriptOutput('[Pre-Request] Executing script...');

          try {
            const result = await workspace.rest.executeScript(
              entityId,
              entity.script,
              currentContext,
              false,
            );

            if (result.result.success) {
              currentContext = result.context;
              appendScriptOutput('[Pre-Request] Script completed successfully');

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
                  cookies: [],
                  textBody: bodyStr,
                  binaryBody: null,
                  bodyType: 'text',
                  time: 0,
                  size: new Blob([bodyStr]).size,
                  bodyTruncated: false,
                };
                appendScriptOutput(
                  '[Pre-Request] Mock response returned, skipping HTTP request',
                );
              }
            } else {
              appendScriptOutput(
                `[Pre-Request] Script failed: ${result.result.error}`,
              );
            }
          } catch (err) {
            appendScriptOutput(
              `[Pre-Request] Script error: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
          }
        }

        if (isCancelledRef.current) {
          setState((prev) => ({ ...prev, phase: 'cancelled' }));
          return;
        }

        let response: RestResponse;

        if (mockResponse) {
          response = mockResponse;
          const blobUrl = createResponseBlobUrl(response);
          setState((prev) => ({ ...prev, response, blobUrl }));
        } else {
          setState((prev) => ({ ...prev, phase: 'sending' }));

          const modifiedEntity: RestEntityData = {
            ...entity,
            url: currentContext.request.url,
            method: currentContext.request.method,
            requestHeaders: Object.entries(currentContext.request.headers).map(
              ([key, value]) => ({ key, value, enabled: true }),
            ),
            requestBody: currentContext.request.body
              ? { ...entity.requestBody!, value: currentContext.request.body }
              : entity.requestBody,
          };

          const outcome = await controllerRef.current.execute({
            entity: modifiedEntity,
            pathParams,
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

          response = outcome.response!;
          const blobUrl = createResponseBlobUrl(response);
          setState((prev) => ({ ...prev, response, blobUrl }));
        }

        if (entity.script?.code?.trim()) {
          const canSendBodyToScript =
            !response.bodyTruncated && response.bodyType === 'text';

          setState((prev) => ({ ...prev, phase: 'post-response-script' }));
          appendScriptOutput('[Post-Response] Executing onResponse...');

          if (!canSendBodyToScript) {
            appendScriptOutput(
              '[Post-Response] Response body not available to script (binary or too large)',
            );
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
            const result = await workspace.rest.executeScript(
              entityId,
              entity.script,
              responseContext,
              true,
            );

            if (result.result.success) {
              appendScriptOutput(
                '[Post-Response] Script completed successfully',
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
              );
            }
          } catch (err) {
            appendScriptOutput(
              `[Post-Response] Script error: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
          }
        }

        // TODO: Run test assertions using entity.testScript

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
