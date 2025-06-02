/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommandCommon, YasumuBootstrapOptions } from '@yasumu/core';
import memfs from 'memfs';
import { createVolume } from 'memfs/lib/volume-localstorage';
// @ts-ignore
import bpath from 'path-browserify';
import type {
  Callback,
  WebSocketCommon,
  WebSocketImpl,
  WsConnectionConfig,
  WsMessage,
  WsMessageSend,
} from '@yasumu/core';

export function WebAdapter(): YasumuBootstrapOptions {
  console.log('Loading WebAdapter');

  const fs =
    typeof localStorage !== 'undefined'
      ? memfs.createFsFromVolume(new (createVolume('yasumu-fs'))())
      : memfs.fs;

  return {
    adapters: {
      app: {
        async getName() {
          return 'Yasumu';
        },
        async getRuntimeVersion() {
          return '0.0.1-web';
        },
        async getVersion() {
          return '0.0.1-web';
        },
      },
      command: {
        // eslint-disable-next-line
        async addPluginListener(
          plugin: unknown,
          event: unknown,
          cb: unknown,
        ) {},
        // eslint-disable-next-line
        async invoke(command: unknown, args: unknown, options: unknown) {},
      } as unknown as CommandCommon,
      async createStore(name: string) {
        const makeKey = (key: string) => `yasumu_kv::${name}:${key}`;
        return {
          async delete(key) {
            localStorage.removeItem(makeKey(key));
            return true;
          },
          async entries() {
            return Object.entries(localStorage) as any;
          },
          async get(key) {
            return localStorage.getItem(makeKey(key)) as any;
          },
          async has(key) {
            return localStorage.getItem(makeKey(key)) !== null;
          },
          async keys() {
            return Object.keys(localStorage);
          },
          async length() {
            return localStorage.length;
          },
          async load() {
            //
          },
          // eslint-disable-next-line
          async onChange(cb) {
            //
            return () => {};
          },
          // eslint-disable-next-line
          async onKeyChange(key, cb) {
            //
            return () => {};
          },
          async reset() {
            localStorage.clear();
          },
          async save() {
            //
          },
          async set(key, value) {
            localStorage.setItem(makeKey(key), value as string);
          },
          async values() {
            return Object.values(localStorage);
          },
        };
      },
      dialog: {
        async open(options) {
          void options;
          return null;
        },
        async save(options) {
          void options;
          return null;
        },
      },
      events: {} as any,
      fs: {
        async copyFile(fromPath, toPath) {
          fs.copyFileSync(fromPath, toPath);
        },
        async exists(path) {
          return fs.existsSync(path);
        },
        async lstat(path) {
          const result = fs.lstatSync(path);
          return {
            isDirectory: result.isDirectory(),
            isFile: result.isFile(),
            isSymlink: result.isSymbolicLink(),
            size: result.size,
          };
        },
        async mkdir(path, options) {
          fs.mkdirSync(path, options);
        },
        async readDir(path) {
          const res = fs.readdirSync(path, { withFileTypes: true });

          return res.map((r: any) => {
            return {
              isDirectory: r.isDirectory(),
              isFile: r.isFile(),
              isSymlink: r.isSymbolicLink(),
              name: r.name,
            };
          });
        },
        async readFile(path) {
          return fs.readFileSync(path, { encoding: 'buffer' }) as Uint8Array;
        },
        async readTextFile(path) {
          return fs.readFileSync(path, { encoding: 'utf8' }) as string;
        },
        async remove(path, options) {
          fs.rmSync(path, options);
        },
        async rename(oldPath, newPath) {
          fs.renameSync(oldPath, newPath);
        },
        async watch(paths: any, callback: any, options) {
          const watcher = fs.watch(paths, options, (event, filename) => {
            callback(event, filename);
          });

          return () => watcher.close();
        },
        async watchImmediate(paths: any, callback: any, options) {
          const watcher = fs.watch(paths, options, (event, filename) => {
            callback(event, filename);
          });

          return () => watcher.close();
        },
        async writeFile(path, data, options) {
          void options;
          fs.writeFileSync(path, data, { encoding: 'buffer' });
        },
        async writeTextFile(path, data, options) {
          void options;
          fs.writeFileSync(path, data, { encoding: 'utf-8' });
        },
      },
      path: {
        async allLogDirs() {
          return '';
        },
        async basename(path, ext) {
          return bpath.basename(path, ext);
        },
        async appCacheDir() {
          return '';
        },
        async appConfigDir() {
          return '';
        },
        async appDataDir() {
          return '';
        },
        async appLocalDataDir() {
          return '';
        },
        async audioDir() {
          return '';
        },
        async cacheDir() {
          return '';
        },
        async configDir() {
          return '';
        },
        async dataDir() {
          return '';
        },
        delimiter() {
          return ';';
        },
        async desktopDir() {
          return '';
        },
        async dirname(path) {
          return bpath.dirname(path);
        },
        async documentDir() {
          return '';
        },
        async downloadDir() {
          return '';
        },
        async executableDir() {
          return '';
        },
        async extname(path) {
          return bpath.extname(path);
        },
        async fontDir() {
          return '';
        },
        async homeDir() {
          return '';
        },
        async isAbsolute(path) {
          return bpath.isAbsolute(path);
        },
        async join(...paths) {
          return bpath.join(...paths);
        },
        async localDataDir() {
          return '';
        },
        async normalize(path) {
          return bpath.normalize(path);
        },
        async pictureDir() {
          return '';
        },
        async publicDir() {
          return '';
        },
        async resolve(...paths) {
          return bpath.resolve(...paths);
        },
        async resolveResource(resourcePath) {
          return resourcePath;
        },
        async resourceDir() {
          return '';
        },
        async runtimeDir() {
          return '';
        },
        sep() {
          return bpath.sep;
        },
        async tempDir() {
          return '';
        },
        async templateDir() {
          return '';
        },
        async videoDir() {
          return '';
        },
      },
      process: {
        async exit(code) {
          void code;
          try {
            window.close();
          } catch {}
        },
        async relaunch() {
          window.location.reload();
        },
      },
      shell: {
        async open(path, openWith) {
          void openWith;
          window.open(path);
        },
      },
      fetch,
      websocket: (() => {
        let id = 0;

        type WsListener = Set<Callback<[WsMessage], unknown>>;

        class WebSocketMock implements WebSocketCommon {
          async connect(
            url: string,
            config?: WsConnectionConfig,
          ): Promise<WebSocketImpl> {
            const nextId = id++;
            void config;

            return new Promise<WebSocketInner>((resolve, reject) => {
              const ws = new WebSocket(url);
              const listeners: WsListener = new Set();

              ws.onmessage = (event) => {
                const message: WsMessage = JSON.parse(event.data);
                listeners.forEach((listener) => listener(message));
              };

              ws.onclose = () => {
                listeners.clear();
              };

              ws.onopen = () => {
                resolve(
                  new WebSocketInner(
                    nextId,
                    listeners,
                    () => {
                      ws.close();
                    },
                    (payload) => {
                      ws.send(JSON.stringify(payload));
                    },
                  ),
                );
              };

              ws.onerror = (err) => {
                reject(err);
              };
            });
          }
        }

        class WebSocketInner implements WebSocketImpl {
          public constructor(
            public readonly id: number,
            private readonly listeners: WsListener,
            private readonly close: Callback,
            private readonly _send: Callback<[WsMessageSend], void>,
          ) {}

          addListener(cb: Callback<[WsMessage], unknown>): Callback {
            this.listeners.add(cb);

            return () => {
              this.listeners.delete(cb);
            };
          }

          disconnect(): void {
            this.close();
          }

          async send(message: WsMessageSend): Promise<void> {
            this._send(message);
          }
        }

        return new WebSocketMock();
      })(),
    },
  };
}
