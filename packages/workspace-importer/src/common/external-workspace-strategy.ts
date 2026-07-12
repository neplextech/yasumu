import type { ExternalWorkspaceImportStrategy } from '@yasumu/common';

import type { YasumuWorkspaceFormat } from './yasumu-workspace-format.js';

export type MaybePromise<T> = Promise<T> | T;

export interface ExternalWorkspaceStrategy {
  readonly name: ExternalWorkspaceImportStrategy;
  import(content: string): MaybePromise<YasumuWorkspaceFormat>;
  export(workspace: YasumuWorkspaceFormat): MaybePromise<unknown>;
}
