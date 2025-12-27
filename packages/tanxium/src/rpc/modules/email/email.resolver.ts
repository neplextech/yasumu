import { Mutation, Query, Resolver } from '@yasumu/den';
import { YasumuRpcService } from '@yasumu/rpc';
import { EmailService } from './email.service.ts';
import { WorkspaceId } from '../common/decorators.ts';
import type { EmailData, ListEmailOptions } from '@yasumu/common';
import type { SmtpConfig } from '@yasumu/common';
import type { PaginatedResult } from '@yasumu/common';

@Resolver('emails')
export class EmailResolver implements YasumuRpcService<'emails'> {
  public constructor(private readonly emailService: EmailService) {}

  @Mutation()
  public deleteEmail(
    @WorkspaceId() workspaceId: string,
    id: string,
  ): Promise<void> {
    return this.emailService.deleteEmail(workspaceId, id);
  }

  @Query()
  public getEmail(
    @WorkspaceId() workspaceId: string,
    id: string,
  ): Promise<EmailData> {
    return this.emailService.getEmail(workspaceId, id);
  }

  @Query()
  public getSmtpConfig(
    @WorkspaceId() workspaceId: string,
  ): Promise<SmtpConfig> {
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
  public updateSmtpConfig(
    @WorkspaceId() workspaceId: string,
    data: Partial<SmtpConfig>,
  ): Promise<void> {
    return this.emailService.updateSmtpConfig(workspaceId, data);
  }
}
