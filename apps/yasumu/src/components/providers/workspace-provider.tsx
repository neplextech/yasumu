'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/api/tanxium.api';
import { invoke } from '@tauri-apps/api/core';
import { message } from '@tauri-apps/plugin-dialog';
import { exit } from '@tauri-apps/plugin-process';
import LoadingScreen from '../visuals/loading-screen';
import { exponentialBackoff } from '@/lib/utils/exponential-backoff';
import { Workspace, Yasumu, createYasumu } from '@yasumu/core';
import { useRouter } from 'next/navigation';
import {
  asPathIdentifier,
  DEFAULT_WORKSPACE_PATH,
} from '@yasumu/tanxium/src/rpc/common/constants';

export interface YasumuContextData {
  client: ReturnType<typeof createClient>;
  port: number;
  yasumu: Yasumu;
  currentWorkspaceId: string | null;
}

const YasumuContext = createContext<YasumuContextData | null>(null);

export function useYasumu() {
  const context = useContext(YasumuContext);

  if (!context) {
    throw new Error('useYasumu() must be used within a <WorkspaceProvider />');
  }

  return context;
}

export function useActiveWorkspace(): Workspace;
export function useActiveWorkspace(strict: true): Workspace;
export function useActiveWorkspace(strict: false): Workspace | null;
export function useActiveWorkspace(strict: boolean = true): Workspace | null {
  const { yasumu } = useYasumu();
  const workspace = yasumu.workspaces.getActiveWorkspace();

  if (strict && !workspace) {
    throw new Error('Active workspace not found');
  }

  return workspace;
}

export default function WorkspaceProvider({
  children,
}: React.PropsWithChildren) {
  const [port, setPort] = useState<number | null>(null);
  const [client, setClient] = useState<ReturnType<typeof createClient> | null>(
    null,
  );
  const [yasumu, setYasumu] = useState<Yasumu | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    null,
  );
  const router = useRouter();

  const initializeYasumuEnvironment = async () => {
    let attempt: number;
    for (attempt = 0; attempt < 5; attempt++) {
      try {
        const port = await invoke<number | null>('get_rpc_port');
        if (!port) throw new Error('Tanxium sent invalid port');

        const client = createClient(port);
        const yasumu = createYasumu({
          platformBridge: {
            async invoke(context, command) {
              const payload = {
                command: {
                  ...command,
                  isType: undefined,
                },
                context,
              };

              console.log(`Invoking ${command.command}...`, {
                data: command.parameters,
              });

              const res = await client.rpc.$post({
                json: payload,
              });
              const json = (await res.json().catch(() => null)) as any;

              console.log({ command: command.command, json });

              if (!res.ok || !json || json.result === undefined) {
                const error =
                  json?.message ??
                  json?.error?.message ??
                  'Unknown error from RPC layer';
                throw new Error(error);
              }

              return json.result;
            },
          },
          events: {
            onWorkspaceActivated: (workspace) => {
              setCurrentWorkspaceId(workspace.id);
              router.replace('/en/workspaces/default/rest');
            },
            onWorkspaceDeactivated: () => {
              setCurrentWorkspaceId(null);
              router.replace('/');
            },
          },
        });

        await yasumu.initialize();

        // if (!yasumu.workspaces.getActiveWorkspace()) {
        //   await yasumu.workspaces.open({
        //     id: asPathIdentifier(DEFAULT_WORKSPACE_PATH),
        //   });
        // }

        globalThis.yasumu = yasumu;

        setPort(port);
        setClient(client);
        setYasumu(yasumu);

        return;
      } catch (error) {
        console.error(
          `[${attempt + 1}/5] Failed to discover the Tanxium server port:`,
          error,
        );
      }

      await exponentialBackoff(attempt);
    }

    await message(
      `Failed to discover the Yasumu RPC port after ${attempt} attempts`,
      {
        kind: 'error',
        title: 'Yasumu - Error',
      },
    );

    exit(1);
  };

  useEffect(() => {
    void initializeYasumuEnvironment();
  }, []);

  if (!client || !port || !yasumu) {
    return <LoadingScreen fullScreen message="Connecting to RPC server..." />;
  }

  return (
    <YasumuContext.Provider
      value={{
        client,
        port,
        yasumu,
        currentWorkspaceId,
      }}
    >
      {children}
    </YasumuContext.Provider>
  );
}
