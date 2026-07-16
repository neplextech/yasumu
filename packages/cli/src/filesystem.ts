import { existsSync } from 'node:fs';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { basename, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import {
  YasumuError,
  YasumuErrorCodes,
  type FileOpenResult,
  type FileResolver,
  type WorkspaceSource,
  type WorkspaceSourceFile,
  type YasumuWorkspace,
} from '@yasumu/headless';
import type { ResolvedScriptFile, YasumuFileReference } from '@yasumu/runtime-api';

export function resolveWorkspaceRoot(input: string | undefined, cwd = process.cwd()): string {
  const base = resolve(cwd, input ?? '.');
  if (existsSync(join(base, 'workspace.ysl'))) return base;
  return join(base, 'yasumu');
}

export class FileSystemWorkspaceSource implements WorkspaceSource {
  constructor(readonly root: string) {}

  async list(): Promise<WorkspaceSourceFile[]> {
    if (!existsSync(this.root)) return [];
    const paths = await listFiles(this.root);
    const yslPaths = paths.filter((path) => path.endsWith('.ysl')).sort((left, right) => left.localeCompare(right));
    return Promise.all(
      yslPaths.map(async (path) => ({
        path,
        content: await readFile(join(this.root, ...path.split('/')), 'utf8'),
      })),
    );
  }
}

export class NodeWorkspaceFileResolver implements FileResolver {
  async resolve(workspace: YasumuWorkspace, path: string): Promise<ResolvedScriptFile> {
    const root = requireWorkspaceRoot(workspace);
    const canonicalRoot = await realpath(root);
    const resolvedPath = await resolveWorkspaceFile(canonicalRoot, path);
    const metadata = await stat(resolvedPath);
    if (!metadata.isFile()) {
      throw new YasumuError(YasumuErrorCodes.FileNotFound, `Workspace file is not a regular file: ${path}`);
    }
    const workspacePath = toWorkspacePath(canonicalRoot, resolvedPath);
    return {
      id: `workspace:${workspacePath}`,
      name: basename(resolvedPath),
      mimeType: inferMimeType(resolvedPath),
      size: metadata.size,
      source: { type: 'workspace-path', path: workspacePath },
      resolvedPath,
    };
  }

  async open(
    workspace: YasumuWorkspace,
    reference: YasumuFileReference,
    signal?: AbortSignal,
  ): Promise<FileOpenResult> {
    signal?.throwIfAborted();
    if (reference.source.type === 'inline') {
      const bytes = new Uint8Array(reference.source.bytes);
      return {
        file: { ...reference, size: bytes.byteLength },
        blob: new Blob([bytes], { type: reference.mimeType }),
      };
    }
    if (reference.source.type === 'host-handle') {
      throw new YasumuError(
        YasumuErrorCodes.FileAccessDenied,
        `Host file handles are not available in the CLI: ${reference.source.handleId}`,
      );
    }

    const file = await this.resolve(workspace, reference.source.path);
    if (!file.resolvedPath) {
      throw new YasumuError(YasumuErrorCodes.FileNotFound, `Workspace file could not be resolved: ${reference.name}`);
    }
    const bytes = await readFile(file.resolvedPath);
    signal?.throwIfAborted();
    return {
      file,
      blob: new Blob([bytes], { type: file.mimeType }),
    };
  }
}

async function listFiles(root: string, prefix = ''): Promise<string[]> {
  const directory = join(root, ...prefix.split('/').filter(Boolean));
  const entries = await readdir(directory, { withFileTypes: true });
  const paths: string[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) paths.push(...(await listFiles(root, path)));
    else if (entry.isFile()) paths.push(path);
  }
  return paths;
}

function requireWorkspaceRoot(workspace: YasumuWorkspace): string {
  if (!workspace.root) {
    throw new YasumuError(YasumuErrorCodes.FileAccessDenied, 'The workspace does not define a filesystem root');
  }
  return workspace.root;
}

async function resolveWorkspaceFile(root: string, path: string): Promise<string> {
  const candidate = isAbsolute(path) ? path : resolve(root, path);
  let resolvedPath: string;
  try {
    resolvedPath = await realpath(candidate);
  } catch (error) {
    throw new YasumuError(YasumuErrorCodes.FileNotFound, `Workspace file not found: ${path}`, { cause: error });
  }
  if (!isWithin(root, resolvedPath)) {
    throw new YasumuError(YasumuErrorCodes.FileAccessDenied, `Workspace file escapes the workspace root: ${path}`);
  }
  return resolvedPath;
}

function isWithin(root: string, candidate: string): boolean {
  const path = relative(root, candidate);
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path));
}

function toWorkspacePath(root: string, path: string): string {
  return relative(root, path).split(sep).join('/');
}

function inferMimeType(path: string): string {
  switch (extname(path).toLowerCase()) {
    case '.json':
      return 'application/json';
    case '.txt':
    case '.log':
      return 'text/plain';
    case '.html':
      return 'text/html';
    case '.csv':
      return 'text/csv';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}
