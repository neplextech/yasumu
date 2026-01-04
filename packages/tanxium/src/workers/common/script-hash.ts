import { createHash } from 'node:crypto';

export function computeScriptHash(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function makeModuleKey(entityId: string, hash: string): string {
  return `${entityId}.ts?h=${hash}`;
}
