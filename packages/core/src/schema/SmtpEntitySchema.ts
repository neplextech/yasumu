import { t, type YasumuSchemaParsableToType } from '@yasumu/schema';
import { WorkspaceModuleType } from '../modules/common/constants.js';

export const SmtpEntitySchema = t.script({
  annotation: WorkspaceModuleType.SMTP,
  blocks: {
    Metadata: t.object({
      name: t.string(),
      id: t.string(),
      createdAt: t.number(),
      path: t.string(),
    }),
  },
});

export type SmtpEntitySchemaType = YasumuSchemaParsableToType<
  typeof SmtpEntitySchema
>;
