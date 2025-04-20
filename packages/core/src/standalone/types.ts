import { YASUMU_API_VERSION } from '@/common/constants.js';
import type {
  WorkspaceModuleType,
  YasumuEntityDataMap,
} from '../modules/index.js';
import type { Index } from '../indexer/YasumuIndexerService.js';
import type { WorkspaceSchemaType } from '../schema/WorkspaceSchema.js';

export type StandaloneIndex = Record<string, Index>;

export type WithStandaloneIndex<T> = {
  indexes: StandaloneIndex;
  entities: T;
};

export interface YasumuStandaloneFormat {
  $$typeof: 'yasumu.standalone';
  workspace: WorkspaceSchemaType;
  entities: Partial<{
    [K in WorkspaceModuleType]: WithStandaloneIndex<
      Record<string, YasumuEntityDataMap[K]>
    >;
  }>;
}

export function createStandalone(
  data: Omit<YasumuStandaloneFormat, '$$typeof'>,
): YasumuStandaloneFormat {
  return {
    ...data,
    workspace: {
      ...data.workspace,
      blocks: {
        ...data.workspace.blocks,
        Metadata: {
          ...data.workspace.blocks.Metadata,
          version: YASUMU_API_VERSION,
        },
      },
    },
    $$typeof: 'yasumu.standalone',
  };
}
