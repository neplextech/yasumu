import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { WorkspaceData } from '@yasumu/common';

export type WorkspacePathTarget = 'workspace' | 'rest' | 'graphql' | 'sse' | 'environment' | 'smtp';

export function getWorkspacePath(workspace: WorkspaceData, target: WorkspacePathTarget): string {
  const root = join(workspace.path, 'yasumu');
  switch (target) {
    case 'workspace':
      return root;
    case 'rest':
      return join(root, 'rest');
    case 'graphql':
      return join(root, 'graphql');
    case 'sse':
      return join(root, 'sse');
    case 'environment':
      return join(root, 'environment');
    case 'smtp':
      return root;
    default:
      return target satisfies never;
  }
}

export async function ensurePath(path: string): Promise<void> {
  if (!existsSync(path)) {
    await Deno.mkdir(path, { recursive: true });
  }
}

export async function readYslFile(filePath: string): Promise<string | null> {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    return await Deno.readTextFile(filePath);
  } catch {
    return null;
  }
}

export async function listYslFiles(dirPath: string): Promise<string[]> {
  if (!existsSync(dirPath)) {
    return [];
  }

  const files: string[] = [];
  try {
    for await (const entry of Deno.readDir(dirPath)) {
      if (entry.isFile && entry.name.endsWith('.ysl')) {
        files.push(join(dirPath, entry.name));
      }
    }
  } catch {
    return [];
  }
  return files;
}

export function topologicalSortGroups<T extends { parentId: string | null | undefined }>(
  entries: [string, T][],
): [string, T][] {
  const sorted: [string, T][] = [];
  const visited = new Set<string>();
  const idSet = new Set(entries.map(([id]) => id));

  const visit = (id: string, data: T) => {
    if (visited.has(id)) return;
    visited.add(id);

    if (data.parentId && idSet.has(data.parentId)) {
      const parent = entries.find(([pid]) => pid === data.parentId);
      if (parent) {
        visit(parent[0], parent[1]);
      }
    }

    sorted.push([id, data]);
  };

  for (const [id, data] of entries) {
    visit(id, data);
  }

  return sorted;
}
