import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import type { PlatformBridge } from '@yasumu/core';

type RpcSuccess = { result: unknown };
type RpcFailure = { error?: { message?: unknown }; message?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getRpcErrorMessage(payload: unknown, status: number): string {
  if (isRecord(payload)) {
    if (typeof payload.message === 'string') return payload.message;

    if (isRecord(payload.error) && typeof payload.error.message === 'string') {
      return payload.error.message;
    }
  }

  return `Yasumu RPC request failed with status ${status}`;
}

function isRpcSuccess(payload: unknown): payload is RpcSuccess {
  return isRecord(payload) && Object.hasOwn(payload, 'result');
}

export function createRpcBridge(port: number): PlatformBridge {
  const invoke: PlatformBridge['invoke'] = async (context, command) => {
    const response = await tauriFetch(`http://localhost:${port}/rpc`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        context,
        command: {
          command: command.command,
          parameters: command.parameters,
          type: command.type,
        },
      }),
    });

    let payload: RpcSuccess | RpcFailure | unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`Yasumu RPC returned an invalid JSON response (status ${response.status})`);
    }

    if (!response.ok || !isRpcSuccess(payload)) {
      throw new Error(getRpcErrorMessage(payload, response.status));
    }

    return payload.result as never;
  };

  return { invoke };
}
