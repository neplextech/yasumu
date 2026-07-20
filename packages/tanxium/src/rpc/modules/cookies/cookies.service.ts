import { Injectable } from '@yasumu/den';
import type { CookieIngestionResult, WorkspaceCookie, WorkspaceCookieInput } from '@yasumu/headless';

import { ExecutionService } from '../execution/execution.service.ts';

@Injectable()
export class CookiesService {
  public constructor(private readonly executionService: ExecutionService) {}

  public list(workspaceId: string): Promise<WorkspaceCookie[]> {
    return this.executionService.listCookies(workspaceId);
  }

  public upsert(workspaceId: string, input: WorkspaceCookieInput): Promise<WorkspaceCookie> {
    return this.executionService.upsertCookie(workspaceId, input);
  }

  public delete(workspaceId: string, cookieId: string): Promise<void> {
    return this.executionService.deleteCookie(workspaceId, cookieId);
  }

  public clear(workspaceId: string): Promise<void> {
    return this.executionService.clearCookies(workspaceId);
  }

  public resolve(workspaceId: string, url: string): Promise<string | null> {
    return this.executionService.resolveCookieHeader(workspaceId, url);
  }

  public ingest(workspaceId: string, url: string, setCookieHeaders: string[]): Promise<CookieIngestionResult> {
    return this.executionService.ingestCookies(workspaceId, url, setCookieHeaders);
  }
}
