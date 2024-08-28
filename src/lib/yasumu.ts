import { fetch } from '@tauri-apps/plugin-http';
import { Store } from '@tauri-apps/plugin-store';
import * as events from '@tauri-apps/api/event';
import * as path from '@tauri-apps/api/path';
import * as fs from '@tauri-apps/plugin-fs';
import * as dialog from '@tauri-apps/plugin-dialog';
import { createYasumu, FileSystemCommon, StoreCommon, PathCommon, EventsCommon, ScriptsCommon } from '@yasumu/core';
import * as app from '@tauri-apps/api/app';
import { invoke, addPluginListener } from '@tauri-apps/api/core';
import * as shell from '@tauri-apps/plugin-shell';
import * as process from '@tauri-apps/plugin-process';
import { prepareScript } from './scripts/script';
import { toast } from 'sonner';

export const Yasumu = createYasumu({
  fetch,
  fs: fs as unknown as FileSystemCommon,
  app: {
    getName: app.getName,
    getRuntimeVersion: app.getTauriVersion,
    getVersion: app.getVersion,
  },
  createStore(store: string) {
    return new Store(store) as unknown as StoreCommon;
  },
  dialog: dialog,
  path: path as unknown as PathCommon,
  events: events as EventsCommon,
  scripts: {
    async evaluate<T>(script: string, contextData: string): Promise<T> {
      try {
        const result = await Yasumu.commands.invoke<string>('evaluate_javascript', {
          code: `try{${prepareScript(script, contextData)}}catch(e){String(e.stack||e)}`,
        });

        try {
          return JSON.parse(result);
        } catch {
          return result as unknown as T;
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to evaluate script!', { description: String(e) });
        return null as unknown as T;
      }
    },
  } satisfies ScriptsCommon,
  commands: {
    invoke,
    addPluginListener,
  },
  process,
  shell,
});
