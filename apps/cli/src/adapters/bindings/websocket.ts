import type {
  Callback,
  WebSocketCommon,
  WebSocketImpl,
  WsConnectionConfig,
  WsMessage,
  WsMessageSend,
} from '@yasumu/core';

let id = 0;

type WsListener = Set<Callback<[WsMessage], unknown>>;

export class WebSocketDriver implements WebSocketCommon {
  async connect(
    url: string,
    config?: WsConnectionConfig,
  ): Promise<WebSocketImpl> {
    const nextId = id++;

    return new Promise<WebSocketInner>((resolve, reject) => {
      const ws = new WebSocket(url);
      const listeners: WsListener = new Set();

      ws.onmessage = (event) => {
        const message: WsMessage = JSON.parse(event.data);
        listeners.forEach((listener) => listener(message));
      };

      ws.onclose = () => {
        listeners.clear();
      };

      ws.onerror = (error) => {
        reject(error);
      };

      ws.onopen = () => {
        resolve(
          new WebSocketInner(
            nextId,
            listeners,
            () => {
              ws.close();
            },
            (payload) => {
              ws.send(JSON.stringify(payload));
            },
          ),
        );
      };
    });
  }
}

class WebSocketInner implements WebSocketImpl {
  public constructor(
    public readonly id: number,
    private readonly listeners: WsListener,
    private readonly close: Callback,
    private readonly _send: Callback<[WsMessageSend], void>,
  ) {}

  addListener(cb: Callback<[WsMessage], unknown>): Callback {
    this.listeners.add(cb);

    return () => {
      this.listeners.delete(cb);
    };
  }

  disconnect(): void {
    this.close();
  }

  async send(message: WsMessageSend): Promise<void> {
    this._send(message);
  }
}

export function createWebSocket(): WebSocketCommon {
  return new WebSocketDriver();
}
