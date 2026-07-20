import type { ExecutionResult, SseEvent } from '@yasumu/core';

export const MAX_BINARY_BODY_SIZE = 10 * 1024 * 1024;
export const MAX_TEXT_BODY_SIZE = 1024 * 1024;

export type ResponseBodyType = 'text' | 'binary';

export interface RestResponse {
  status: number;
  statusText: string;
  time: number;
  headers: Record<string, string>;
  cookies: string[];
  textBody: string | null;
  binaryBody: ArrayBuffer | null;
  bodyType: ResponseBodyType;
  size: number;
  bodyTruncated: boolean;
  isEventStream: boolean;
  streamConnected: boolean;
  events: SseEvent[];
}

/** Maps the serializable headless response into the existing response-panel model. */
export function restResponseFromExecution(result: ExecutionResult): RestResponse | null {
  const response = result.response;
  if (!response) return null;

  const headers = Object.fromEntries(response.headers);
  const cookies = response.headers.filter(([name]) => name.toLowerCase() === 'set-cookie').map(([, value]) => value);
  const body = response.body;
  const isEventStream =
    headers['x-yasumu-original-content-type']?.toLowerCase().includes('text/event-stream') === true ||
    headers['content-type']?.toLowerCase().includes('text/event-stream') === true;

  if (body.kind === 'binary') {
    const bytes = Uint8Array.from(body.bytes ?? []);
    return {
      status: response.status,
      statusText: response.statusText,
      time: result.durationMs,
      headers,
      cookies,
      textBody: null,
      binaryBody: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      bodyType: 'binary',
      size: body.size,
      bodyTruncated: body.truncated,
      isEventStream,
      streamConnected: false,
      events: result.events,
    };
  }

  const textBody = body.kind === 'empty' ? '' : body.kind === 'json' ? JSON.stringify(body.value) : body.text;
  return {
    status: response.status,
    statusText: response.statusText,
    time: result.durationMs,
    headers,
    cookies,
    textBody,
    binaryBody: null,
    bodyType: 'text',
    size: body.size,
    bodyTruncated: body.truncated,
    isEventStream,
    streamConnected: false,
    events: result.events,
  };
}
