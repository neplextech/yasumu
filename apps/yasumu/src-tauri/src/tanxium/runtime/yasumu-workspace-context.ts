import {
  YasumuWorkspaceEnvironment,
  type EnvironmentData,
} from './yasumu-request.ts';

export interface YasumuWorkspaceData {
  id: string;
  name: string;
  path: string | null;
}

export interface YasumuWorkspaceContextData {
  workspace: YasumuWorkspaceData;
  environment: EnvironmentData | null;
}

export interface YasumuScriptContext {
  workspace: YasumuWorkspace;
}

export class YasumuWorkspace {
  public readonly env: YasumuWorkspaceEnvironment;
  public readonly id: string;
  public readonly name: string;
  public readonly path: string | null;
  public readonly emails: YasumuEmailService;
  private readonly context!: YasumuWorkspaceContextData;

  public constructor(context: YasumuWorkspaceContextData) {
    this.env = new YasumuWorkspaceEnvironment(context.environment);
    this.id = context.workspace.id;
    this.name = context.workspace.name;
    this.path = context.workspace.path;
    this.emails = new YasumuEmailService(this);

    Object.defineProperty(this, 'context', {
      value: context,
      enumerable: false,
      writable: false,
    });
  }

  public isDefaultWorkspace() {
    return this.path === null;
  }

  public toContext(): YasumuWorkspaceContextData {
    return {
      workspace: this.context.workspace,
      environment: this.env.toData(),
    };
  }

  public toJSON(): YasumuWorkspaceData {
    return {
      id: this.id,
      name: this.name,
      path: this.path,
    };
  }
}

export interface YasumuEmail {
  /**
   * The ID of the email.
   */
  id: string;
  /**
   * The from address of the email.
   */
  from: string;
  /**
   * The to addresses of the email.
   */
  to: string;
  /**
   * The subject of the email.
   */
  subject: string;
  /**
   * The HTML body of the email.
   */
  html: string;
  /**
   * The text body of the email.
   */
  text: string;
  /**
   * The CC addresses of the email.
   */
  cc: string | null;
  /**
   * The read/unread status of the email.
   */
  unread: boolean;
  /**
   * The date and time the email was created.
   */
  createdAt: number;
  /**
   * The date and time the email was last updated.
   */
  updatedAt: number;
}

export type YasumuEmailFilter = (
  email: YasumuEmail,
) => boolean | Promise<boolean>;

interface EmailEvent {
  workspaceId: string;
  email: YasumuEmail;
}

export class YasumuEmailService {
  public constructor(private readonly workspace: YasumuWorkspace) {}

  public awaitEmail(
    filter: YasumuEmailFilter,
    timeout?: number,
  ): Promise<YasumuEmail> {
    const { promise, reject, resolve } = Promise.withResolvers<YasumuEmail>();

    const unsubscribe = Yasumu.queue.subscribe(
      'yasumu:new-email',
      async (event: EmailEvent) => {
        try {
          const { workspaceId, email } = event;
          if (workspaceId !== this.workspace.id) return;

          if (await filter(email)) {
            unsubscribe();
            resolve(email);
          }
        } catch (error) {
          unsubscribe();
          reject(error ?? new Error('Unknown error occurred'));
        }
      },
    );

    if (timeout) {
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Timeout waiting for email'));
      }, timeout);
    }

    return promise;
  }
}
