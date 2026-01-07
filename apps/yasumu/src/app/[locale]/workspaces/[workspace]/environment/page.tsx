'use client';

import {
  useEnvironments,
  useUpdateEnvironments,
} from '@/app/[locale]/workspaces/[workspace]/environment/_hooks/useEnvironments';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import ErrorScreen from '@/components/visuals/error-screen';
import LoadingScreen from '@/components/visuals/loading-screen';
import { useQuery } from '@tanstack/react-query';
import { Environment, TabularPair } from '@yasumu/core';
import { Badge } from '@yasumu/ui/components/badge';
import { Separator } from '@yasumu/ui/components/separator';
import { toast } from '@yasumu/ui/components/sonner';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { parseAsString, useQueryState } from 'nuqs';
import { useEffect, useEffectEvent } from 'react';
import { useEnvironmentStore } from '../../_stores/environment-store';
import EnvironmentList from './_components/environment-list';
import SecretsTable from './_components/secrets-table';
import VariablesTable from './_components/variables-table';

export default function EnvironmentPage() {
  const {
    environments,
    selectedEnvironment,
    setSelectedEnvironment,
    setEnvironments,
    updateEnvironment,
  } = useEnvironmentStore();
  const workspace = useActiveWorkspace();
  const [currentEnvironmentId, setCurrentEnvironmentId] = useQueryState<string>(
    'environmentId',
    parseAsString.withDefault(selectedEnvironment?.id ?? ''),
  );

  console.log({
    currentEnvironmentId,
    selectedEnvironmentId: selectedEnvironment?.id,
  });

  const currentEnvironment = environments.find(
    (env) => env.id === currentEnvironmentId,
  );

  const {
    data: environmentsList,
    refetch,
    isError,
    isLoading,
  } = useEnvironments();
  const updateEnvironments = useUpdateEnvironments();

  const {
    data: selectedEnvironmentData,
    isLoading: isLoadingSelectedEnvironment,
  } = useQuery({
    queryKey: ['currentEnvironment'],
    queryFn: () => workspace.environments.getActiveEnvironment(),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always' as const,
  });

  const updateCurrentEnvironment = useEffectEvent(() => {
    if (currentEnvironmentId) return;
    if (selectedEnvironment) {
      setCurrentEnvironmentId(selectedEnvironment.id);
      return;
    }
    if (environments.length > 0) {
      setCurrentEnvironmentId(environments[0]?.id);
    }
  });

  useEffect(() => {
    if (environmentsList) {
      setEnvironments(environmentsList);
      updateCurrentEnvironment();
    }
  }, [environmentsList]);

  useEffect(() => {
    if (selectedEnvironmentData === undefined) return;
    setSelectedEnvironment(selectedEnvironmentData);
    updateCurrentEnvironment();
  }, [selectedEnvironmentData]);

  const handleAddEnvironment = async (
    name: string,
    secrets?: TabularPair[],
    variables?: TabularPair[],
  ) => {
    const env = await workspace.environments.create({
      name,
      secrets,
      variables,
    });
    const newEnvironments = [...environments, env];
    setEnvironments(newEnvironments);
    updateEnvironments(newEnvironments);
    setCurrentEnvironmentId(env.id);
  };

  const handleDeleteEnvironment = async (id: string) => {
    await workspace.environments.delete(id);
    const newEnvironments = environments.filter((env) => env.id !== id);
    updateEnvironments(newEnvironments);
    setEnvironments(newEnvironments);
    if (currentEnvironmentId === id) {
      setCurrentEnvironmentId(environments[0]?.id);
    }
  };

  const handleRenameEnvironment = async (id: string, name: string) => {
    const env = environments.find((e) => e.id === id);
    if (!env) return;
    await env.update({ name });
    updateEnvironment(id, { name });

    await refetch();
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
    updateEnvironments(newEnvironments);
    setCurrentEnvironmentId(env.id);
    toast.success('Environment duplicated successfully');
  };

  const onVariablesSave = async (
    environment: Environment,
    variables: TabularPair[],
  ) => {
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

  const onSecretsSave = async (
    environment: Environment,
    secrets: TabularPair[],
  ) => {
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
    <div className="flex h-full bg-background">
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentEnvironment ? (
          <div className="flex-1 overflow-auto p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold">
                  {currentEnvironment.name}
                </h2>
                {selectedEnvironment?.id === currentEnvironmentId ? (
                  <Badge variant="outline">Active</Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                Manage variables and secrets for{' '}
                <span className="font-semibold font-mono underline">
                  {currentEnvironment.name}
                </span>{' '}
                environment
              </p>
            </div>
            <Separator />
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Variables</h3>
                <VariablesTable
                  environment={currentEnvironment}
                  variables={currentEnvironment.variables.toJSON() || []}
                  onSave={withErrorHandler(onVariablesSave)}
                />
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Secrets</h3>
                <SecretsTable
                  environment={currentEnvironment}
                  secrets={currentEnvironment.secrets.toJSON() || []}
                  onSave={withErrorHandler(onSecretsSave)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">
                No environment selected
              </p>
              <p className="text-sm">
                Select or create an environment from the list
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
