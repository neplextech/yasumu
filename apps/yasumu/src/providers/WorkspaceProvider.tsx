'use client';

import { Yasumu, YasumuEnvironment, YasumuWorkspaceEvents } from '@yasumu/core';
import { initYasumu } from '@/lib/yasumu';
import { LoaderCircle } from 'lucide-react';
import React, { createContext, useEffect, useState } from 'react';
import { NoWorkspaceScreen } from '@/components/NoWorkspace';
import { useWebWarning } from '@/hooks/use-web-warning';

export interface YasumuContextData {
  yasumu: Yasumu;
  environments: YasumuEnvironment[];
  selectedEnvironmentId: string | null;
}

const YasumuContext = createContext<YasumuContextData | null>(null);

export function useYasumu() {
  const ctx = React.useContext(YasumuContext);
  if (!ctx) throw new Error('useYasumu must be used within a YasumuProvider');

  return ctx;
}

export function useWorkspace() {
  const { yasumu } = useYasumu();

  return yasumu.workspace;
}

export function useYasumuEnvironments() {
  const { environments } = useYasumu();

  return environments;
}

export function useCurrentEnvironment() {
  const { yasumu } = useYasumu();

  return yasumu.workspace?.environments.getSelectedEnvironment();
}

export default function WorkspaceProvider({ children }: React.PropsWithChildren) {
  const [yasumu, setYasumu] = useState<Yasumu | null>(null);
  const [loading, setLoading] = useState(true);
  const [environments, setEnvironments] = React.useState<YasumuEnvironment[]>([]);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = React.useState<string | null>(null);

  useWebWarning();

  useEffect(() => {
    if (!yasumu?.workspace) return;
    setEnvironments(yasumu.workspace?.environments.getEnvironments() ?? []);

    const listener = () => {
      console.log('environment event listener', yasumu.workspace?.environments.getEnvironments());
      setEnvironments(yasumu.workspace?.environments.getEnvironments() ?? []);
    };

    const selectionListener = (env: YasumuEnvironment) => {
      setSelectedEnvironmentId(env.id);
    };

    const unselectListener = () => {
      setSelectedEnvironmentId(null);
    };

    yasumu.workspace?.events.on(YasumuWorkspaceEvents.EnvironmentCreated, listener);
    yasumu.workspace?.events.on(YasumuWorkspaceEvents.EnvironmentDeleted, listener);
    yasumu.workspace?.events.on(YasumuWorkspaceEvents.EnvironmentUpdated, listener);
    yasumu.workspace?.events.on(YasumuWorkspaceEvents.EnvironmentSelected, selectionListener);
    yasumu.workspace?.events.on(YasumuWorkspaceEvents.EnvironmentSelectionRemoved, unselectListener);

    return () => {
      yasumu.workspace?.events.off(YasumuWorkspaceEvents.EnvironmentCreated, listener);
      yasumu.workspace?.events.off(YasumuWorkspaceEvents.EnvironmentDeleted, listener);
      yasumu.workspace?.events.off(YasumuWorkspaceEvents.EnvironmentUpdated, listener);
      yasumu.workspace?.events.off(YasumuWorkspaceEvents.EnvironmentSelected, selectionListener);
      yasumu.workspace?.events.off(YasumuWorkspaceEvents.EnvironmentSelectionRemoved, unselectListener);
    };
  }, [yasumu]);

  useEffect(() => {
    initYasumu()
      .then((yasumu) => {
        // @ts-expect-error - Expose yasumu to the window for debugging
        window['yasumu'] = yasumu;
        setYasumu(yasumu);
        setLoading(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-full grid place-items-center">
        <LoaderCircle className="size-8 animate-spin" />
      </div>
    );
  }

  if (!yasumu) {
    return <NoWorkspaceScreen />;
  }

  return (
    <YasumuContext.Provider value={{ yasumu: yasumu, environments, selectedEnvironmentId }}>
      {!yasumu.workspace ? <NoWorkspaceScreen /> : children}
    </YasumuContext.Provider>
  );
}
