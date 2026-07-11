import type { EmailData, ListEmailOptions } from '@yasumu/common';
import type { SmtpConfig } from '@yasumu/common';
import type { PaginatedResult } from '@yasumu/common';
import { Mutation, Query, Resolver } from '@yasumu/den';
import { YasumuRpcService } from '@yasumu/rpc';

import { WorkspaceId } from '../common/decorators.ts';
import { EmailService } from './email.service.ts';

@Resolver('emails')
export class EmailResolver implements YasumuRpcService<'emails'> {
  public constructor(private readonly emailService: EmailService) {}

  @Query()
  public getSmtpPort(@WorkspaceId() workspaceId: string): Promise<number | null> {
    return Promise.resolve(this.emailService.getActiveSmtpPort(workspaceId));
  }

  @Mutation()
  public deleteEmail(@WorkspaceId() workspaceId: string, id: string): Promise<void> {
    return this.emailService.deleteEmail(workspaceId, id);
  }

  @Query()
  public getEmail(@WorkspaceId() workspaceId: string, id: string): Promise<EmailData> {
    return this.emailService.getEmail(workspaceId, id);
  }

  @Query()
  public getSmtpConfig(@WorkspaceId() workspaceId: string): Promise<SmtpConfig> {
    return this.emailService.getSmtp(workspaceId);
  }

  @Query()
  public listEmails(
    @WorkspaceId() workspaceId: string,
    options: ListEmailOptions,
  ): Promise<PaginatedResult<EmailData>> {
    return this.emailService.listEmails(workspaceId, options);
  }

  @Mutation()
  public updateSmtpConfig(@WorkspaceId() workspaceId: string, data: Partial<SmtpConfig>): Promise<void> {
    return this.emailService.updateSmtpConfig(workspaceId, data);
  }
}
