import type {
  Callback,
  DirEntry,
  FileInfo,
  FilePath,
  FileSystemCommon,
  MkdirOptions,
  RemoveOptions,
  WatchOptions,
  WriteFileOptions,
} from '@yasumu/common';
// TODO: use memfs instead of node fs
import fs from 'node:fs';
import type { IDirent } from 'memfs/lib/node/types/misc.js';

export class FileSystemMock implements FileSystemCommon {
  public async lstat(path: FilePath): Promise<FileInfo> {
    const stats = await fs.promises.stat(path);

    return {
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      isSymlink: stats.isSymbolicLink(),
      size: stats.size,
    };
  }

  public async copyFile(fromPath: FilePath, toPath: FilePath): Promise<void> {
    return fs.promises.copyFile(fromPath, toPath);
  }

  public async exists(path: FilePath): Promise<boolean> {
    return fs.existsSync(path);
  }

  public async mkdir(path: FilePath, options?: MkdirOptions): Promise<void> {
    await fs.promises.mkdir(path, options);
  }

  public async readDir(path: FilePath): Promise<DirEntry[]> {
    const data = (await fs.promises.readdir(path, {
      withFileTypes: true,
    })) as IDirent[];

    const entries: DirEntry[] = data.map((entry) => {
      return {
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        isSymlink: entry.isSymbolicLink(),
        name: String(entry.name),
      };
    });

    return entries;
  }

  public async readFile(path: FilePath): Promise<Uint8Array> {
    const data = await fs.promises.readFile(path, { encoding: 'binary' });

    return data as unknown as Uint8Array;
  }

  public async readTextFile(path: FilePath): Promise<string> {
    const data = await fs.promises.readFile(path, { encoding: 'utf8' });
    return data;
  }

  public async remove(path: FilePath, options?: RemoveOptions): Promise<void> {
    return fs.promises.rm(path, options);
  }

  public async rename(oldPath: FilePath, newPath: FilePath): Promise<void> {
    return fs.promises.rename(oldPath, newPath);
  }

  public async watch(
    paths: FilePath | FilePath[],
    callback: Callback<any>,
    options?: WatchOptions,
  ): Promise<Callback> {
    const watcher = fs.watch(paths as string, options, (event, file) => {
      callback(event, file);
    });

    return () => {
      watcher.close();
    };
  }

  public async watchImmediate(
    paths: FilePath | FilePath[],
    callback: Callback<any>,
    options?: WatchOptions,
  ): Promise<Callback> {
    const watcher = fs.watch(paths as string, options, (event, file) => {
      callback(event, file);
    });

    return () => {
      watcher.close();
    };
  }

  public async writeFile(
    path: FilePath,
    data: Uint8Array,
    options?: WriteFileOptions,
  ): Promise<void> {
    return fs.promises.writeFile(path, data);
  }

  public async writeTextFile(
    path: FilePath,
    data: string,
    options?: WriteFileOptions,
  ): Promise<void> {
    return fs.promises.writeFile(path, data, { encoding: 'utf8' });
  }
}
