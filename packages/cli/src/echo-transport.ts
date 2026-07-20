import { createServer, type Server } from 'node:http';

import { echoServer } from '@yasumu/echo-server';
import type { RequestTransport, RequestTransportContext } from '@yasumu/headless';

const ECHO_HOSTNAME = 'echo.yasumu.local';

/** Fetch transport that resolves Yasumu's local echo hostname without DNS or an external service. */
export class CliFetchTransport implements RequestTransport {
  private server?: Server;
  private address?: Promise<string>;

  async send(request: Request, context: RequestTransportContext, signal: AbortSignal): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === ECHO_HOSTNAME) {
      const address = await this.ensureEchoServer();
      const rewritten = new URL(`${url.pathname}${url.search}`, address);
      request = new Request(rewritten, request);
    }

    return fetch(
      new Request(request, {
        signal,
        redirect: context.followRedirects === false ? 'manual' : 'follow',
      }),
    );
  }

  async dispose(): Promise<void> {
    const server = this.server;
    this.server = undefined;
    this.address = undefined;
    if (!server) return;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
  }

  private ensureEchoServer(): Promise<string> {
    this.address ??= new Promise((resolve, reject) => {
      const server = createServer(async (incoming, outgoing) => {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of incoming) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          const body = chunks.length ? Buffer.concat(chunks) : undefined;
          const request = new Request(`http://${ECHO_HOSTNAME}${incoming.url ?? '/'}`, {
            method: incoming.method,
            headers: incoming.headers as HeadersInit,
            body,
          });
          const response = await echoServer.fetch(request);
          outgoing.writeHead(response.status, response.statusText, Object.fromEntries(response.headers));
          if (!response.body) return outgoing.end();
          const reader = response.body.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              outgoing.write(value);
            }
          } finally {
            reader.releaseLock();
          }
          outgoing.end();
        } catch (error) {
          outgoing.statusCode = 500;
          outgoing.end(error instanceof Error ? error.message : String(error));
        }
      });
      this.server = server;
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        server.removeListener('error', reject);
        const address = server.address();
        if (!address || typeof address === 'string') return reject(new Error('Unable to start the local echo server'));
        resolve(`http://127.0.0.1:${address.port}`);
      });
    });
    return this.address;
  }
}
