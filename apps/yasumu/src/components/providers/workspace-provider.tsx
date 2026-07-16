'use client';

import { useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { message } from '@tauri-apps/plugin-dialog';
import { exit } from '@tauri-apps/plugin-process';
import { Workspace, Yasumu, createYasumu } from '@yasumu/core';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useEnvironmentStore } from '@/app/[locale]/workspaces/_stores/environment-store';
import { useTanxiumEvent } from '@/hooks/use-tanxium-event';
import { createRpcBridge } from '@/lib/api/tanxium.api';
import { trackEvent } from '@/lib/instrumentation/analytics';
import { exponentialBackoff } from '@/lib/utils/exponential-backoff';

import LoadingScreen, { type RpcDiscoveryStatus } from '../visuals/loading-screen';

const RPC_DISCOVERY_ATTEMPTS = 5;
const WORKSPACE_SECTIONS = ['rest', 'graphql', 'socketio', 'websocket', 'sse', 'emails', 'environment'] as const;

type WorkspaceSection = (typeof WORKSPACE_SECTIONS)[number];

interface RuntimeResource {
  port: number;
  echoServerPort: number | null;
  mcpServerPort: number | null;
  yasumu: Yasumu;
}

export type YasumuRuntimeContextData = RuntimeResource;

export interface WorkspaceSessionContextData {
  currentWorkspaceId: string | null;
  currentWorkspace: Workspace | null;
}

export type YasumuContextData = YasumuRuntimeContextData & WorkspaceSessionContextData;

const YasumuRuntimeContext = createContext<YasumuRuntimeContextData | null>(null);
const WorkspaceSessionContext = createContext<WorkspaceSessionContextData | null>(null);

let runtimeResourcePromise: Promise<RuntimeResource> | null = null;
const discoveryListeners = new Set<(status: RpcDiscoveryStatus) => void>();

function publishDiscoveryStatus(status: RpcDiscoveryStatus): void {
  for (const listener of discoveryListeners) listener(status);
}

async function discoverRuntime(): Promise<RuntimeResource> {
  let lastError: string | undefined;

  for (let attempt = 0; attempt < RPC_DISCOVERY_ATTEMPTS; attempt += 1) {
    publishDiscoveryStatus({
      attempt: attempt + 1,
      maxAttempts: RPC_DISCOVERY_ATTEMPTS,
      phase: attempt === 0 ? 'discovering' : 'retrying',
      lastError,
    });

    try {
      const port = await invoke<number | null>('get_rpc_port');
      if (!port) throw new Error('Tanxium returned an invalid RPC port');

      const [echoServerPort, mcpServerPort] = await Promise.all([
        invoke<number | null>('get_echo_server_port'),
        invoke<number | null>('get_mcp_server_port'),
      ]);
      const yasumu = createYasumu({ platformBridge: createRpcBridge(port) });

      await yasumu.initialize();

      return { port, echoServerPort, mcpServerPort, yasumu };
    } catch (error) {
      console.error(`[${attempt + 1}/${RPC_DISCOVERY_ATTEMPTS}] Failed to discover the Tanxium runtime:`, error);
      lastError = error instanceof Error ? error.message : 'The local Yasumu runtime has not exposed an RPC port yet.';

      if (attempt === RPC_DISCOVERY_ATTEMPTS - 1) break;

      const retryDelay = Math.pow(2, attempt) * 1000;
      publishDiscoveryStatus({
        attempt: attempt + 1,
        maxAttempts: RPC_DISCOVERY_ATTEMPTS,
        phase: 'retrying',
        lastError,
        retryAt: Date.now() + retryDelay,
      });
      await exponentialBackoff(attempt);
    }
  }

  throw new Error(lastError ?? 'Failed to connect to the local Yasumu runtime');
}

function getRuntimeResource(): Promise<RuntimeResource> {
  runtimeResourcePromise ??= discoverRuntime().catch((error) => {
    runtimeResourcePromise = null;
    throw error;
  });
  return runtimeResourcePromise;
}

function isWorkspacePath(pathname: string): boolean {
  return pathname.includes('/workspaces/');
}

function getCurrentSection(pathname: string): WorkspaceSection | null {
  return WORKSPACE_SECTIONS.find((section) => pathname.endsWith(`/${section}`)) ?? null;
}

function getWorkspaceRoute(pathname: string, section: WorkspaceSection): Route {
  const locale = pathname.split('/').filter(Boolean)[0] ?? 'en';
  return `/${locale}/workspaces/default/${section}` as Route;
}

export function useYasumuRuntime(): YasumuRuntimeContextData {
  const context = useContext(YasumuRuntimeContext);
  if (!context) throw new Error('useYasumuRuntime() must be used within a <WorkspaceProvider />');
  return context;
}

export function useWorkspaceSession(): WorkspaceSessionContextData {
  const context = useContext(WorkspaceSessionContext);
  if (!context) throw new Error('useWorkspaceSession() must be used within a <WorkspaceProvider />');
  return context;
}

/** @deprecated Prefer useYasumuRuntime or useWorkspaceSession to avoid unrelated rerenders. */
export function useYasumu(): YasumuContextData {
  const runtime = useYasumuRuntime();
  const session = useWorkspaceSession();
  return useMemo(() => ({ ...runtime, ...session }), [runtime, session]);
}

export function useActiveWorkspace(): Workspace;
export function useActiveWorkspace(strict: true): Workspace;
export function useActiveWorkspace(strict: false): Workspace | null;
export function useActiveWorkspace(strict: boolean = true): Workspace | null {
  const { currentWorkspace } = useWorkspaceSession();

  if (strict && !currentWorkspace) throw new Error('Active workspace not found');
  return currentWorkspace;
}

export function ActiveWorkspaceGuard({
  children,
  fallback,
}: React.PropsWithChildren<{
  fallback?: React.ReactNode;
}>) {
  const { currentWorkspaceId } = useWorkspaceSession();

  if (!currentWorkspaceId) {
    return fallback ?? <LoadingScreen fullScreen message="No workspace found" />;
  }

  return children;
}

export default function WorkspaceProvider({ children }: React.PropsWithChildren) {
  const setSelectedEnvironment = useEnvironmentStore((state) => state.setSelectedEnvironment);
  const setEnvironments = useEnvironmentStore((state) => state.setEnvironments);
  const [runtime, setRuntime] = useState<RuntimeResource | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [rpcDiscovery, setRpcDiscovery] = useState<RpcDiscoveryStatus>({
    attempt: 1,
    maxAttempts: RPC_DISCOVERY_ATTEMPTS,
    phase: 'discovering',
  });
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const activeWorkspaceIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  pathnameRef.current = pathname;
  useTanxiumEvent(runtime?.yasumu ?? null);

  useEffect(() => {
    let cancelled = false;
    const onDiscovery = (status: RpcDiscoveryStatus) => {
      if (!cancelled) setRpcDiscovery(status);
    };
    discoveryListeners.add(onDiscovery);

    void getRuntimeResource()
      .then((resource) => {
        if (cancelled) return;
        const activeWorkspace = resource.yasumu.workspaces.getActiveWorkspace();
        activeWorkspaceIdRef.current = activeWorkspace?.id ?? null;
        setRuntime(resource);
        setCurrentWorkspace(activeWorkspace);

        if (activeWorkspace) {
          const currentPath = pathnameRef.current;
          const section = isWorkspacePath(currentPath) ? getCurrentSection(currentPath) : null;
          router.replace(getWorkspaceRoute(currentPath, section ?? 'rest'));
        }
      })
      .catch(async (error: unknown) => {
        if (cancelled) return;
        const detail = error instanceof Error ? error.message : 'Unknown runtime discovery error';
        await message(`Failed to discover the Yasumu RPC port: ${detail}`, {
          kind: 'error',
          title: 'Yasumu - Error',
        });
        await exit(1);
      });

    return () => {
      cancelled = true;
      discoveryListeners.delete(onDiscovery);
    };
  }, [router]);

  useEffect(() => {
    if (!runtime) return;

    const controller = new AbortController();
    const { signal } = controller;

    const hydrateEnvironmentState = async (workspace: Workspace) => {
      const [environments, selectedEnvironment] = await Promise.all([
        workspace.environments.list(),
        workspace.environments.getActiveEnvironment(),
      ]);
      if (signal.aborted || activeWorkspaceIdRef.current !== workspace.id) return;
      setEnvironments(environments);
      setSelectedEnvironment(selectedEnvironment);
    };

    const activateWorkspace = (workspace: Workspace) => {
      activeWorkspaceIdRef.current = workspace.id;
      void queryClient.cancelQueries();
      queryClient.clear();
      setCurrentWorkspace(workspace);
      void hydrateEnvironmentState(workspace).catch((error: unknown) => {
        if (!signal.aborted) console.error('Failed to load workspace environments:', error);
      });
      trackEvent('workspace_activated', { workspace_id: workspace.id });

      const currentPath = pathnameRef.current;
      const section = isWorkspacePath(currentPath) ? getCurrentSection(currentPath) : null;
      router.replace(getWorkspaceRoute(currentPath, section ?? 'rest'));
    };

    runtime.yasumu.events.on('onWorkspaceActivated', activateWorkspace, { signal });
    runtime.yasumu.events.on(
      'onWorkspaceDeactivated',
      (workspace) => {
        trackEvent('workspace_deactivated', { workspace_id: workspace.id });
        activeWorkspaceIdRef.current = null;
        void queryClient.cancelQueries();
        queryClient.clear();
        setCurrentWorkspace(null);
        setEnvironments([]);
        setSelectedEnvironment(null);
        router.replace('/');
      },
      { signal },
    );
    runtime.yasumu.events.on(
      'onEnvironmentActivated',
      async (workspace) => {
        const environment = await workspace.environments.getActiveEnvironment();
        if (!signal.aborted && activeWorkspaceIdRef.current === workspace.id) setSelectedEnvironment(environment);
      },
      { signal },
    );
    runtime.yasumu.events.on(
      'onEnvironmentCreated',
      async (environment) => {
        const environments = await environment.workspace.environments.list();
        if (!signal.aborted && activeWorkspaceIdRef.current === environment.workspace.id) setEnvironments(environments);
      },
      { signal },
    );
    runtime.yasumu.events.on(
      'onEnvironmentDeleted',
      async (workspace) => {
        const environments = await workspace.environments.list();
        if (!signal.aborted && activeWorkspaceIdRef.current === workspace.id) setEnvironments(environments);
      },
      { signal },
    );
    runtime.yasumu.events.on(
      'onEnvironmentUpdated',
      async (environment) => {
        const environments = await environment.workspace.environments.list();
        if (!signal.aborted && activeWorkspaceIdRef.current === environment.workspace.id) setEnvironments(environments);
      },
      { signal },
    );

    const activeWorkspace = runtime.yasumu.workspaces.getActiveWorkspace();
    if (activeWorkspace) {
      activeWorkspaceIdRef.current = activeWorkspace.id;
      void hydrateEnvironmentState(activeWorkspace).catch((error: unknown) => {
        if (!signal.aborted) console.error('Failed to load workspace environments:', error);
      });
    }

    return () => controller.abort();
  }, [queryClient, router, runtime, setEnvironments, setSelectedEnvironment]);

  const runtimeValue = useMemo<YasumuRuntimeContextData | null>(
    () =>
      runtime
        ? {
            port: runtime.port,
            echoServerPort: runtime.echoServerPort,
            mcpServerPort: runtime.mcpServerPort,
            yasumu: runtime.yasumu,
          }
        : null,
    [runtime],
  );
  const sessionValue = useMemo<WorkspaceSessionContextData>(
    () => ({ currentWorkspace, currentWorkspaceId: currentWorkspace?.id ?? null }),
    [currentWorkspace],
  );

  if (!runtimeValue) return <LoadingScreen rpcDiscovery={rpcDiscovery} />;

  return (
    <YasumuRuntimeContext.Provider value={runtimeValue}>
      <WorkspaceSessionContext.Provider value={sessionValue}>{children}</WorkspaceSessionContext.Provider>
    </YasumuRuntimeContext.Provider>
  );
}
