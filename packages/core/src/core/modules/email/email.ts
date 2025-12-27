import type { Workspace } from '@/core/workspace/workspace.js';
import type {
  EmailData,
  ListEmailOptions,
  PaginatedResult,
  SmtpConfig,
} from '@yasumu/common';

export class EmailModule {
  public constructor(private readonly workspace: Workspace) {}

  public async getSmtpPort(): Promise<number | null> {
    const result =
      await this.workspace.manager.yasumu.rpc.emails.getSmtpPort.$query({
        parameters: [],
      });

    return result;
  }

  public async getSmtpConfig(): Promise<SmtpConfig> {
    const result =
      await this.workspace.manager.yasumu.rpc.emails.getSmtpConfig.$query({
        parameters: [],
      });

    return result;
  }

  public async updateSmtpConfig(data: Partial<SmtpConfig>): Promise<void> {
    await this.workspace.manager.yasumu.rpc.emails.updateSmtpConfig.$mutate({
      parameters: [data],
    });
  }

  public async listEmails(
    options: ListEmailOptions,
  ): Promise<PaginatedResult<EmailData>> {
    const result =
      await this.workspace.manager.yasumu.rpc.emails.listEmails.$query({
        parameters: [options],
      });

    return result;
  }

  public async getEmail(id: string): Promise<EmailData> {
    const result =
      await this.workspace.manager.yasumu.rpc.emails.getEmail.$query({
        parameters: [id],
      });

    return result;
  }

  public async deleteEmail(id: string): Promise<void> {
    await this.workspace.manager.yasumu.rpc.emails.deleteEmail.$mutate({
      parameters: [id],
    });
  }
}
