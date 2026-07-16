import { readFile, realpath, stat } from "node:fs/promises";
import {
  basename,
  extname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";

import {
  type FileOpenResult,
  type FileResolver,
  YasumuError,
  YasumuErrorCodes,
  type YasumuWorkspace,
} from "@yasumu/headless";
import type {
  ResolvedScriptFile,
  YasumuFileReference,
} from "@yasumu/runtime-api";

export interface SerializableGuiFile {
  name: string;
  bytes: number[];
  mimeType?: string;
}

export interface GuiFileHandleStore {
  get(
    handleId: string,
    signal?: AbortSignal,
  ): Promise<SerializableGuiFile | null>;
}

/** In-memory bridge for renderer-selected files without persisting browser File objects. */
export class InMemoryGuiFileHandleStore implements GuiFileHandleStore {
  readonly #files = new Map<string, SerializableGuiFile>();

  public register(
    handleId: string,
    file: SerializableGuiFile,
  ): YasumuFileReference {
    const stored = cloneSerializableFile(file);
    this.#files.set(handleId, stored);
    return {
      id: `host:${handleId}`,
      name: stored.name,
      mimeType: stored.mimeType,
      size: stored.bytes.length,
      source: { type: "host-handle", handleId },
    };
  }

  public delete(handleId: string): boolean {
    return this.#files.delete(handleId);
  }

  public clear(): void {
    this.#files.clear();
  }

  // deno-lint-ignore require-await
  public async get(
    handleId: string,
    signal?: AbortSignal,
  ): Promise<SerializableGuiFile | null> {
    signal?.throwIfAborted();
    const file = this.#files.get(handleId);
    return file ? cloneSerializableFile(file) : null;
  }
}

/** Resolves workspace, inline, and renderer-selected file references for the GUI host. */
export class GuiFileResolver implements FileResolver {
  public constructor(
    private readonly handles: GuiFileHandleStore =
      new InMemoryGuiFileHandleStore(),
  ) {}

  public async resolve(
    workspace: YasumuWorkspace,
    path: string,
  ): Promise<ResolvedScriptFile> {
    const resolved = await resolveWorkspaceFile(workspace, path);
    const information = await stat(resolved.absolutePath);
    if (!information.isFile()) {
      throw fileError(
        YasumuErrorCodes.FileNotFound,
        `Workspace file is not a regular file: ${path}`,
        workspace,
        path,
      );
    }
    return {
      id: `workspace:${resolved.referencePath}`,
      name: basename(resolved.absolutePath),
      mimeType: inferMimeType(resolved.absolutePath),
      size: information.size,
      source: { type: "workspace-path", path: resolved.referencePath },
      resolvedPath: resolved.absolutePath,
    };
  }

  public async open(
    workspace: YasumuWorkspace,
    reference: YasumuFileReference,
    signal?: AbortSignal,
  ): Promise<FileOpenResult> {
    signal?.throwIfAborted();
    switch (reference.source.type) {
      case "inline":
        return openSerializable(reference, {
          name: reference.name,
          mimeType: reference.mimeType,
          bytes: reference.source.bytes,
        });
      case "host-handle": {
        const file = await this.handles.get(reference.source.handleId, signal);
        if (!file) {
          throw fileError(
            YasumuErrorCodes.FileNotFound,
            `GUI file handle is no longer available: ${reference.source.handleId}`,
            workspace,
          );
        }
        signal?.throwIfAborted();
        return openSerializable(reference, file);
      }
      case "workspace-path": {
        const file = await this.resolve(workspace, reference.source.path);
        const bytes = await readFile(
          file.resolvedPath!,
          signal ? { signal } : undefined,
        );
        signal?.throwIfAborted();
        const blob = new Blob([toArrayBuffer(bytes)], {
          type: reference.mimeType ?? file.mimeType,
        });
        return {
          file: {
            ...file,
            id: reference.id,
            name: reference.name || file.name,
            mimeType: reference.mimeType ?? file.mimeType,
            size: bytes.byteLength,
          },
          blob,
        };
      }
    }
  }
}

async function resolveWorkspaceFile(
  workspace: YasumuWorkspace,
  requestedPath: string,
): Promise<{ absolutePath: string; referencePath: string }> {
  if (!workspace.root) {
    throw fileError(
      YasumuErrorCodes.FileAccessDenied,
      "This workspace does not expose a filesystem root",
      workspace,
    );
  }
  if (!requestedPath || isAbsolute(requestedPath)) {
    throw fileError(
      YasumuErrorCodes.FileAccessDenied,
      `Workspace file paths must be relative: ${requestedPath || "<empty>"}`,
      workspace,
      requestedPath,
    );
  }

  try {
    const sourceRoot = resolve(workspace.root, "yasumu");
    const [root, candidate] = await Promise.all([
      realpath(sourceRoot),
      realpath(resolve(sourceRoot, requestedPath)),
    ]);
    if (!isWithin(root, candidate)) {
      throw fileError(
        YasumuErrorCodes.FileAccessDenied,
        `Workspace file path escapes the workspace root: ${requestedPath}`,
        workspace,
        requestedPath,
      );
    }
    return {
      absolutePath: candidate,
      referencePath: normalizeReferencePath(relative(root, candidate)),
    };
  } catch (error) {
    if (error instanceof YasumuError) throw error;
    throw fileError(
      YasumuErrorCodes.FileNotFound,
      `Workspace file not found: ${requestedPath}`,
      workspace,
      requestedPath,
      error,
    );
  }
}

function isWithin(root: string, candidate: string): boolean {
  const difference = relative(root, candidate);
  return difference === "" ||
    (!difference.startsWith(`..${sep}`) && difference !== ".." &&
      !isAbsolute(difference));
}

function normalizeReferencePath(path: string): string {
  return path.split(/[\\/]+/).filter(Boolean).join("/");
}

function openSerializable(
  reference: YasumuFileReference,
  input: SerializableGuiFile,
): FileOpenResult {
  const file = cloneSerializableFile(input);
  const mimeType = reference.mimeType ?? file.mimeType ??
    inferMimeType(file.name);
  return {
    file: {
      ...reference,
      name: reference.name || file.name,
      mimeType,
      size: file.bytes.length,
    },
    blob: new Blob([Uint8Array.from(file.bytes).buffer as ArrayBuffer], {
      type: mimeType,
    }),
  };
}

function cloneSerializableFile(file: SerializableGuiFile): SerializableGuiFile {
  if (!file.name) throw new TypeError("GUI files must have a name");
  if (
    !file.bytes.every((byte) =>
      Number.isInteger(byte) && byte >= 0 && byte <= 255
    )
  ) {
    throw new TypeError(
      "GUI file bytes must contain integers between 0 and 255",
    );
  }
  return { name: file.name, mimeType: file.mimeType, bytes: [...file.bytes] };
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function inferMimeType(path: string): string {
  return MIME_TYPES[extname(path).toLowerCase()] ?? "application/octet-stream";
}

const MIME_TYPES: Readonly<Record<string, string>> = {
  ".csv": "text/csv",
  ".gif": "image/gif",
  ".html": "text/html",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".webp": "image/webp",
  ".xml": "application/xml",
  ".zip": "application/zip",
};

function fileError(
  code:
    | typeof YasumuErrorCodes.FileNotFound
    | typeof YasumuErrorCodes.FileAccessDenied,
  message: string,
  workspace: YasumuWorkspace,
  file?: string,
  cause?: unknown,
): YasumuError {
  return new YasumuError(code, message, {
    workspaceId: workspace.id,
    file,
    cause,
  });
}
