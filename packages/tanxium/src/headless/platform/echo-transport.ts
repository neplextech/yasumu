import type {
  RequestTransport,
  RequestTransportContext,
} from "@yasumu/headless";

export const GUI_ECHO_HOSTNAME = "echo.yasumu.local";

export type EchoServerPortProvider = () => number | null | undefined;
export type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

let activeEchoServerPort: number | null = null;

/** Updates the port used by GUI requests targeting the embedded echo server. */
export function setGuiEchoServerPort(port: number | null): void {
  if (port !== null && (!Number.isInteger(port) || port < 1 || port > 65_535)) {
    throw new RangeError(`Invalid echo server port: ${port}`);
  }
  activeEchoServerPort = port;
}

export function getGuiEchoServerPort(): number | null {
  return activeEchoServerPort;
}

/** Fetch transport for the desktop host, including its stable echo-server alias. */
export class GuiFetchTransport implements RequestTransport {
  public constructor(
    private readonly port: EchoServerPortProvider = getGuiEchoServerPort,
    private readonly fetchImplementation: FetchImplementation = fetch,
  ) {}

  public send(
    request: Request,
    context: RequestTransportContext,
    signal: AbortSignal,
  ): Promise<Response> {
    signal.throwIfAborted();
    const url = rewriteGuiEchoUrl(request.url, this.port());
    return this.fetchImplementation(
      new Request(url, {
        body: request.body,
        headers: request.headers,
        method: request.method,
        signal,
        redirect: context.followRedirects === false ? "manual" : "follow",
        // Request streams require this in Node-compatible fetch implementations.
        duplex: request.body ? "half" : undefined,
      } as RequestInit),
    );
  }
}

export function rewriteGuiEchoUrl(
  value: string | URL,
  port: number | null | undefined,
): URL {
  const url = new URL(value);
  if (url.hostname !== GUI_ECHO_HOSTNAME) return url;
  if (port === null || port === undefined) {
    throw new Error("The embedded Yasumu echo server is not available");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new RangeError(`Invalid echo server port: ${port}`);
  }
  url.protocol = "http:";
  url.hostname = "127.0.0.1";
  url.port = String(port);
  return url;
}
