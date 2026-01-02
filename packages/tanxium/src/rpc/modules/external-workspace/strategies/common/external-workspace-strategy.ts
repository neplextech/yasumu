import type { ExternalWorkspaceImportStrategy } from '@yasumu/common';
import { YasumuWorkspaceFormat } from './yasumu-workspace-format.ts';

type MaybePromise<T> = Promise<T> | T;

export interface ExternalWorkspaceStrategy {
  readonly name: ExternalWorkspaceImportStrategy;
  import(content: string): MaybePromise<YasumuWorkspaceFormat>;
  export(workspace: YasumuWorkspaceFormat): MaybePromise<unsafe>;
}
