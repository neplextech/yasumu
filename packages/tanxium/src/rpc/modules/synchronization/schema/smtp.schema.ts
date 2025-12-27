import { t } from '@yasumu/schema';
import { YasumuAnnotations } from './constants.ts';

export const SmtpSchema = t.script({
  annotation: YasumuAnnotations.Smtp,
  blocks: {
    metadata: t.object({
      id: t.string(),
      port: t.number(),
      username: t.nullable(t.string()),
      password: t.nullable(t.string()),
    }),
  },
});
