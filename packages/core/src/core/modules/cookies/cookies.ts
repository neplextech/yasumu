import type { CookieIngestionResult, WorkspaceCookie, WorkspaceCookieInput } from '@yasumu/headless';

import type { Workspace } from '../../workspace/workspace.js';

export class CookiesModule {
  public constructor(private readonly workspace: Workspace) {}

  public list(): Promise<WorkspaceCookie[]> {
    return this.workspace.manager.yasumu.rpc.cookies.list.$query({ parameters: [] });
  }

  public upsert(input: WorkspaceCookieInput): Promise<WorkspaceCookie> {
    return this.workspace.manager.yasumu.rpc.cookies.upsert.$mutate({ parameters: [input] });
  }

  public delete(cookieId: string): Promise<void> {
    return this.workspace.manager.yasumu.rpc.cookies.delete.$mutate({ parameters: [cookieId] });
  }

  public clear(): Promise<void> {
    return this.workspace.manager.yasumu.rpc.cookies.clear.$mutate({ parameters: [] });
  }

  public resolve(url: string): Promise<string | null> {
    return this.workspace.manager.yasumu.rpc.cookies.resolve.$query({ parameters: [url] });
  }

  public ingest(url: string, setCookieHeaders: string[]): Promise<CookieIngestionResult> {
    return this.workspace.manager.yasumu.rpc.cookies.ingest.$mutate({ parameters: [url, setCookieHeaders] });
  }
}
