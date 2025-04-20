import type { Callback } from './common.js';

export type FilePath = string | URL;

export interface MkdirOptions {
  recursive?: boolean;
}

export interface RemoveOptions {
  recursive?: boolean;
}

export interface DirEntry {
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
  name: string;
}

export interface WatchOptions {
  delayMs?: number;
  recursive?: boolean;
}

export interface WriteFileOptions {
  append?: boolean;
  create?: boolean;
  createNew?: boolean;
}

export interface FileInfo {
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
  size: number;
}

export interface FileSystemCommon {
  copyFile(fromPath: FilePath, toPath: FilePath): Promise<void>;
  exists(path: FilePath): Promise<boolean>;
  mkdir(path: FilePath, options?: MkdirOptions): Promise<void>;
  lstat(path: FilePath): Promise<FileInfo>;
  readDir(path: FilePath): Promise<DirEntry[]>;
  readFile(path: FilePath): Promise<Uint8Array>;
  readTextFile(path: FilePath): Promise<string>;
  remove(path: FilePath, options?: RemoveOptions): Promise<void>;
  rename(oldPath: FilePath, newPath: FilePath): Promise<void>;
  watch(
    paths: FilePath | FilePath[],
    callback: Callback,
    options?: WatchOptions,
  ): Promise<Callback>;
  watchImmediate(
    paths: FilePath | FilePath[],
    callback: Callback,
    options?: WatchOptions,
  ): Promise<Callback>;
  writeFile(
    path: FilePath,
    data: Uint8Array,
    options?: WriteFileOptions,
  ): Promise<void>;
  writeTextFile(
    path: FilePath,
    data: string,
    options?: WriteFileOptions,
  ): Promise<void>;
}
