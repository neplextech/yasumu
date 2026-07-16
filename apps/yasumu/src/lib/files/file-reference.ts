import type { ExecutionModule, YasumuFileReference } from '@yasumu/core';

export function isYasumuFileReference(value: unknown): value is YasumuFileReference {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const reference = value as Partial<YasumuFileReference>;
  return typeof reference.id === 'string' && typeof reference.name === 'string' && !!reference.source;
}

/** Uploads one browser-selected file and returns the opaque reference safe to persist in a request. */
export async function registerFileReference(
  file: File,
  execution: Pick<ExecutionModule, 'registerFile'>,
): Promise<YasumuFileReference> {
  const bytes = [...new Uint8Array(await file.arrayBuffer())];
  return execution.registerFile({
    name: file.name,
    mimeType: file.type || undefined,
    bytes,
  });
}
