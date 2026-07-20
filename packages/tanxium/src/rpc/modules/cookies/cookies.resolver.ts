import { Mutation, Query, Resolver } from '@yasumu/den';
import type { CookieIngestionResult, WorkspaceCookie, WorkspaceCookieInput } from '@yasumu/headless';
import type { YasumuRpcService } from '@yasumu/rpc';

import { WorkspaceId } from '../common/decorators.ts';
import { CookiesService } from './cookies.service.ts';

@Resolver('cookies')
export class CookiesResolver implements YasumuRpcService<'cookies'> {
  public constructor(private readonly cookiesService: CookiesService) {}

  @Query()
  public list(@WorkspaceId() workspaceId: string): Promise<WorkspaceCookie[]> {
    return this.cookiesService.list(workspaceId);
  }

  @Mutation()
  public upsert(@WorkspaceId() workspaceId: string, input: WorkspaceCookieInput): Promise<WorkspaceCookie> {
    return this.cookiesService.upsert(workspaceId, input);
  }

  @Mutation()
  public delete(@WorkspaceId() workspaceId: string, cookieId: string): Promise<void> {
    return this.cookiesService.delete(workspaceId, cookieId);
  }

  @Mutation()
  public clear(@WorkspaceId() workspaceId: string): Promise<void> {
    return this.cookiesService.clear(workspaceId);
  }

  @Query()
  public resolve(@WorkspaceId() workspaceId: string, url: string): Promise<string | null> {
    return this.cookiesService.resolve(workspaceId, url);
  }

  @Mutation()
  public ingest(
    @WorkspaceId() workspaceId: string,
    url: string,
    setCookieHeaders: string[],
  ): Promise<CookieIngestionResult> {
    return this.cookiesService.ingest(workspaceId, url, setCookieHeaders);
  }
}
