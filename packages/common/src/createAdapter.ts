import type {
  PathCommon,
  FileSystemCommon,
  StoreCommon,
  CommandCommon,
  DialogCommon,
  ProcessCommon,
  ApplicationCommon,
  EventsCommon,
  FetchCommon,
  StoreOptions,
  WebSocketCommon,
} from './types/index.js';
import type { ShellCommon } from './types/shell.js';

export type AdapterCommon =
  | PathCommon
  | FileSystemCommon
  | CommandCommon
  | DialogCommon
  | ProcessCommon
  | ApplicationCommon
  | EventsCommon
  | ShellCommon
  | FetchCommon;

export const AdapterType = {
  Path: 'path',
  FileSystem: 'fs',
  Command: 'command',
  Dialog: 'dialog',
  Process: 'process',
  Application: 'app',
  Events: 'events',
  Shell: 'shell',
  Fetch: 'fetch',
  WebSocket: 'websocket',
} as const;

export type AdapterType = (typeof AdapterType)[keyof typeof AdapterType];

export interface AdapterCommonMap {
  [AdapterType.Path]: PathCommon;
  [AdapterType.FileSystem]: FileSystemCommon;
  [AdapterType.Command]: CommandCommon;
  [AdapterType.Dialog]: DialogCommon;
  [AdapterType.Process]: ProcessCommon;
  [AdapterType.Application]: ApplicationCommon;
  [AdapterType.Events]: EventsCommon;
  [AdapterType.Shell]: ShellCommon;
  [AdapterType.Fetch]: FetchCommon;
  [AdapterType.WebSocket]: WebSocketCommon;
}

export type StoreType = (
  name: string,
  options?: StoreOptions,
) => Promise<StoreCommon>;

export type WithCreateStore<T> = T & { createStore: StoreType };

export type Config<YasumuAdapterType extends AdapterType> = WithCreateStore<
  AdapterCommonMap[YasumuAdapterType]
>;

export function createAdapter<YasumuAdapterType extends AdapterType>(
  type: YasumuAdapterType,
  config: Config<YasumuAdapterType>,
): Config<YasumuAdapterType> {
  if (!(type in AdapterType)) {
    throw new Error(
      `Invalid adapter type "${type}". Must be one of: ${Object.keys(AdapterType).join(', ')}`,
    );
  }

  for (const key in config) {
    if (config[key as keyof typeof config] === undefined) {
      throw new Error(`[${type}] Missing required config value: ${key}`);
    }
  }

  return config;
}
