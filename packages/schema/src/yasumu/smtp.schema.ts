import { t } from '../parsable.js';
import { YasumuAnnotations } from './annotations.js';

export const SmtpSchema = t.script({
  annotation: YasumuAnnotations.Smtp,
  blocks: {
    metadata: t.object({
      id: t.string(),
      port: t.number(),
      username: t.nullable(t.string()),
      password: t.nullable(t.string()),
    }),
    script: t.nullable(t.code()),
  },
});
