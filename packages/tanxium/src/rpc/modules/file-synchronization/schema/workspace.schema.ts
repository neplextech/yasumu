import { t } from '@yasumu/schema';
import { YasumuAnnotations } from './constants.ts';

export const WorkspaceSchema = t.script({
  annotation: YasumuAnnotations.Workspace,
  blocks: {
    metadata: t.object({
      name: t.string(),
      version: t.string(),
    }),
  },
});
