import type { PathCommon } from '@yasumu/common';
import NodePath from 'node:path';
import { homedir, tmpdir } from 'node:os';

export class Path implements PathCommon {
  public async allLogDirs(): Promise<string> {
    return '';
  }
  public async appCacheDir(): Promise<string> {
    return '';
  }
  public async appConfigDir(): Promise<string> {
    return '';
  }
  public async appDataDir(): Promise<string> {
    return '';
  }
  public async appLocalDataDir(): Promise<string> {
    return '';
  }
  public async audioDir(): Promise<string> {
    return '';
  }
  public async basename(
    path: string,
    ext?: string | undefined,
  ): Promise<string> {
    return NodePath.basename(path, ext);
  }
  public async cacheDir(): Promise<string> {
    return '';
  }
  public async configDir(): Promise<string> {
    return '';
  }
  public async dataDir(): Promise<string> {
    return '';
  }
  public delimiter(): string {
    return NodePath.delimiter;
  }
  public async desktopDir(): Promise<string> {
    return '';
  }
  public async dirname(path: string): Promise<string> {
    return NodePath.dirname(path);
  }
  public async documentDir(): Promise<string> {
    return '';
  }
  public async downloadDir(): Promise<string> {
    return '';
  }
  public async executableDir(): Promise<string> {
    return '';
  }
  public async extname(path: string): Promise<string> {
    return NodePath.extname(path);
  }
  public async fontDir(): Promise<string> {
    return '';
  }
  public async homeDir(): Promise<string> {
    return homedir();
  }
  public async isAbsolute(path: string): Promise<boolean> {
    return NodePath.isAbsolute(path);
  }
  public async join(...paths: string[]): Promise<string> {
    return NodePath.join(...paths);
  }
  public async localDataDir(): Promise<string> {
    return '';
  }
  public async normalize(path: string): Promise<string> {
    return NodePath.normalize(path);
  }
  public async pictureDir(): Promise<string> {
    return '';
  }
  public async publicDir(): Promise<string> {
    return '';
  }
  public async resolve(...paths: string[]): Promise<string> {
    return NodePath.resolve(...paths);
  }
  public async resolveResource(resourcePath: string): Promise<string> {
    return '';
  }
  public async resourceDir(): Promise<string> {
    return '';
  }
  public async runtimeDir(): Promise<string> {
    return '';
  }
  public sep(): string {
    return NodePath.sep;
  }
  public async tempDir(): Promise<string> {
    return tmpdir();
  }
  public async templateDir(): Promise<string> {
    return '';
  }
  public async videoDir(): Promise<string> {
    return '';
  }
}

export function createPath(): PathCommon {
  return new Path();
}
