'use client';

import type { Environment, TabularPair } from '@yasumu/core';
import { Badge } from '@yasumu/ui/components/badge';
import { Separator } from '@yasumu/ui/components/separator';
import { toast } from '@yasumu/ui/components/sonner';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { parseAsString, useQueryState } from 'nuqs';
import { useEffect } from 'react';

import {
  useEnvironments,
  useActiveEnvironment,
  useUpdateEnvironments,
} from '@/app/[locale]/workspaces/[workspace]/environment/_hooks/useEnvironments';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import ErrorScreen from '@/components/visuals/error-screen';
import LoadingScreen from '@/components/visuals/loading-screen';

import { useEnvironmentStore } from '../../_stores/environment-store';
import EnvironmentList from './_components/environment-list';
import SecretsTable from './_components/secrets-table';
import VariablesTable from './_components/variables-table';

export default function EnvironmentPage() {
  const environments = useEnvironmentStore((state) => state.environments);
  const selectedEnvironment = useEnvironmentStore((state) => state.selectedEnvironment);
  const setSelectedEnvironment = useEnvironmentStore((state) => state.setSelectedEnvironment);
  const setEnvironments = useEnvironmentStore((state) => state.setEnvironments);
  const workspace = useActiveWorkspace();
  const [currentEnvironmentId, setCurrentEnvironmentId] = useQueryState<string>(
    'environmentId',
    parseAsString.withDefault(''),
  );

  const currentEnvironment = environments.find((env) => env.id === currentEnvironmentId);

  const { data: environmentsList, refetch, isError, isLoading } = useEnvironments();
  const updateEnvironments = useUpdateEnvironments();
  const {
    data: selectedEnvironmentData,
    isFetched: isSelectedEnvironmentFetched,
    refetch: refetchSelectedEnvironment,
  } = useActiveEnvironment();

  useEffect(() => {
    if (environmentsList) {
      setEnvironments(environmentsList);
    }
  }, [environmentsList, setEnvironments]);

  useEffect(() => {
    if (selectedEnvironmentData === undefined) return;
    setSelectedEnvironment(selectedEnvironmentData);
  }, [selectedEnvironmentData, setSelectedEnvironment]);

  useEffect(() => {
    if (!environmentsList || !isSelectedEnvironmentFetched) return;
    if (environmentsList.some((environment) => environment.id === currentEnvironmentId)) return;

    const activeEnvironment = selectedEnvironmentData
      ? environmentsList.find((environment) => environment.id === selectedEnvironmentData.id)
      : null;
    const nextEnvironmentId = activeEnvironment?.id ?? environmentsList[0]?.id ?? '';
    void setCurrentEnvironmentId(nextEnvironmentId);
  }, [
    currentEnvironmentId,
    environmentsList,
    isSelectedEnvironmentFetched,
    selectedEnvironmentData,
    setCurrentEnvironmentId,
  ]);

  const handleAddEnvironment = async (name: string, secrets?: TabularPair[], variables?: TabularPair[]) => {
    const env = await workspace.environments.create({
      name,
      secrets,
      variables,
    });
    const newEnvironments = [...environments, env];
    setEnvironments(newEnvironments);
    await updateEnvironments(newEnvironments);
    await setCurrentEnvironmentId(env.id);
  };

  const handleDeleteEnvironment = async (id: string) => {
    await workspace.environments.delete(id);
    const newEnvironments = environments.filter((env) => env.id !== id);
    setEnvironments(newEnvironments);
    await updateEnvironments(newEnvironments);
    if (currentEnvironmentId === id) {
      await setCurrentEnvironmentId(newEnvironments[0]?.id ?? '');
    }

    const { data: activeEnvironment } = await refetchSelectedEnvironment();
    setSelectedEnvironment(activeEnvironment ?? null);
  };

  const handleRenameEnvironment = async (id: string, name: string) => {
    const env = environments.find((e) => e.id === id);
    if (!env) return;
    await env.update({ name });
    const { data } = await refetch();
    if (data) setEnvironments(data);
    toast.success('Environment renamed successfully');
  };

  const handleDuplicateEnvironment = async (
    _sourceId: string,
    newName: string,
    secrets?: TabularPair[],
    variables?: TabularPair[],
  ) => {
    const env = await workspace.environments.create({
      name: newName,
      secrets,
      variables,
    });
    const newEnvironments = [...environments, env];
    setEnvironments(newEnvironments);
    await updateEnvironments(newEnvironments);
    await setCurrentEnvironmentId(env.id);
    toast.success('Environment duplicated successfully');
  };

  const onVariablesSave = async (environment: Environment, variables: TabularPair[]) => {
    await environment.update(
      {
        variables,
      },
      { noEmit: true },
    );

    const { data } = await refetch();
    if (data) {
      setEnvironments(data);
    }

    toast.success('Variables saved successfully');
  };

  const onSecretsSave = async (environment: Environment, secrets: TabularPair[]) => {
    await environment.update(
      {
        secrets,
      },
      { noEmit: true },
    );

    const { data } = await refetch();
    if (data) {
      setEnvironments(data);
    }

    toast.success('Secrets saved successfully');
  };

  if (isLoading) {
    return <LoadingScreen fullScreen message="Loading environments..." />;
  }

  if (isError) {
    return <ErrorScreen fullScreen message="Error loading environments" />;
  }

  return (
    <div className="bg-background flex h-full">
      <div className="w-[280px] shrink-0">
        <EnvironmentList
          environments={environments}
          activeEnvironmentId={selectedEnvironment?.id}
          selectedEnvironmentId={currentEnvironmentId}
          onSelectEnvironment={setCurrentEnvironmentId}
          onAddEnvironment={withErrorHandler(handleAddEnvironment)}
          onDeleteEnvironment={withErrorHandler(handleDeleteEnvironment)}
          onRenameEnvironment={withErrorHandler(handleRenameEnvironment)}
          onDuplicateEnvironment={withErrorHandler(handleDuplicateEnvironment)}
        />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        {currentEnvironment ? (
          <div className="flex-1 space-y-6 overflow-auto p-6">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-xl font-semibold">{currentEnvironment.name}</h2>
                {selectedEnvironment?.id === currentEnvironmentId ? <Badge variant="outline">Active</Badge> : null}
              </div>
              <p className="text-muted-foreground text-sm">
                Manage variables and secrets for{' '}
                <span className="font-mono font-semibold underline">{currentEnvironment.name}</span> environment
              </p>
            </div>
            <Separator />
            <div className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-semibold">Variables</h3>
                <VariablesTable
                  key={currentEnvironment.id}
                  environment={currentEnvironment}
                  variables={currentEnvironment.variables.toJSON() || []}
                  onSave={withErrorHandler(onVariablesSave)}
                />
              </div>
              <Separator />
              <div>
                <h3 className="mb-4 text-lg font-semibold">Secrets</h3>
                <SecretsTable
                  key={currentEnvironment.id}
                  environment={currentEnvironment}
                  secrets={currentEnvironment.secrets.toJSON() || []}
                  onSave={withErrorHandler(onSecretsSave)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <div className="text-center">
              <p className="mb-2 text-lg font-medium">No environment selected</p>
              <p className="text-sm">Select or create an environment from the list</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
