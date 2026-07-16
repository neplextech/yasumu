import type {
  JsonValue,
  RequestSnapshot,
  ResponseSnapshot,
  SerializedBody,
  SerializedExecutionError,
} from './types.js';

const textContentType = /^(text\/)|json|xml|javascript|css|html|csv|graphql/i;

function headerEntries(headers: Headers): Array<[string, string]> {
  return [...headers.entries()];
}

function contentType(headers: Headers): string | undefined {
  return headers.get('content-type') ?? undefined;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export async function snapshotRequest(request: Request, maxBodyBytes = 1024 * 1024): Promise<RequestSnapshot> {
  return {
    url: request.url,
    method: request.method,
    headers: headerEntries(request.headers),
    body: await snapshotBody(request.clone(), maxBodyBytes),
  };
}

export async function snapshotResponse(response: Response, maxBodyBytes = 10 * 1024 * 1024): Promise<ResponseSnapshot> {
  return {
    status: response.status,
    statusText: response.statusText,
    headers: headerEntries(response.headers),
    body: await snapshotBody(response.clone(), maxBodyBytes),
  };
}

async function snapshotBody(message: Request | Response, maxBodyBytes: number): Promise<SerializedBody> {
  if (!message.body) return { kind: 'empty', size: 0, truncated: false };

  const type = contentType(message.headers);
  const limit = Math.max(0, Math.floor(maxBodyBytes));
  const reader = message.body.getReader();
  const chunks: Uint8Array[] = [];
  let retainedSize = 0;
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    size += value.byteLength;
    const remaining = limit - retainedSize;
    if (remaining <= 0) continue;

    const retained = value.byteLength <= remaining ? value : value.subarray(0, remaining);
    chunks.push(retained);
    retainedSize += retained.byteLength;
  }

  const truncated = size > limit;
  const bytes = new Uint8Array(retainedSize);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  if (type && textContentType.test(type)) {
    const text = new TextDecoder().decode(bytes);
    if (type.toLowerCase().includes('json')) {
      try {
        return { kind: 'json', value: JSON.parse(text) as JsonValue, size, truncated, contentType: type };
      } catch {
        return { kind: 'text', text, size, truncated, contentType: type };
      }
    }
    return { kind: 'text', text, size, truncated, contentType: type };
  }

  return { kind: 'binary', bytes: [...bytes], size, truncated, contentType: type };
}

export function requestFromSnapshot(snapshot: RequestSnapshot): Request {
  return new Request(snapshot.url, {
    method: snapshot.method,
    headers: snapshot.headers,
    body: canHaveBody(snapshot.method) ? bodyFromSnapshot(snapshot.body) : undefined,
  });
}

export function responseFromSnapshot(snapshot: ResponseSnapshot): Response {
  return new Response(bodyFromSnapshot(snapshot.body), {
    status: snapshot.status,
    statusText: snapshot.statusText,
    headers: snapshot.headers,
  });
}

export function bodyFromSnapshot(body: SerializedBody): BodyInit | null {
  switch (body.kind) {
    case 'empty':
      return null;
    case 'text':
      return body.text;
    case 'json':
      return JSON.stringify(body.value);
    case 'binary':
      return new Uint8Array(body.bytes ?? []);
  }
}

function canHaveBody(method: string): boolean {
  const normalized = method.toUpperCase();
  return normalized !== 'GET' && normalized !== 'HEAD';
}

export function serializeError(error: unknown, code = 'SCRIPT_RUNTIME_ERROR'): SerializedExecutionError {
  if (error instanceof Error) {
    const cause = 'cause' in error ? (error as Error & { cause?: unknown }).cause : undefined;

    return {
      name: error.name,
      code,
      message: error.message,
      stack: error.stack,
      cause: cause === undefined ? undefined : serializeError(cause, code),
    };
  }

  return { name: 'Error', code, message: typeof error === 'string' ? error : safeStringify(error) };
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function estimateTextSize(value: string): number {
  return byteLength(value);
}
