'use client';

import { useState, useEffect, useEffectEvent } from 'react';
import { Separator } from '@yasumu/ui/components/separator';
import VariablesTable from './_components/variables-table';
import SecretsTable from './_components/secrets-table';
import EnvironmentList from './_components/environment-list';
import { useEnvironmentStore } from '../../_stores/environment-store';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import LoadingScreen from '@/components/visuals/loading-screen';
import ErrorScreen from '@/components/visuals/error-screen';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { Environment, TabularPair } from '@yasumu/core';
import { Badge } from '@yasumu/ui/components/badge';
import { toast } from '@yasumu/ui/components/sonner';

export default function EnvironmentPage() {
  const {
    environments,
    selectedEnvironment,
    setSelectedEnvironment,
    setEnvironments,
  } = useEnvironmentStore();
  const workspace = useActiveWorkspace();
  const [currentEnvironmentId, setCurrentEnvironmentId] = useState<
    string | undefined
  >(() => selectedEnvironment?.id);
  const currentEnvironment = environments.find(
    (env) => env.id === currentEnvironmentId,
  );

  const [
    { data: environmentsList, refetch, isError, isLoading },
    {
      data: selectedEnvironmentData,
      isLoading: isLoadingSelectedEnvironment,
      refetch: refetchSelectedEnvironment,
    },
  ] = useQueries({
    queries: [
      {
        queryKey: ['environments'],
        queryFn: () => workspace.environments.list(),
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnMount: 'always' as const,
      },
      {
        queryKey: ['currentEnvironment'],
        queryFn: () => workspace.environments.getActiveEnvironment(),
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnMount: 'always' as const,
      },
    ],
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
    setEnvironments([...environments, env]);
    setCurrentEnvironmentId(env.id);
  };

  const handleDeleteEnvironment = async (id: string) => {
    await workspace.environments.delete(id);
    setEnvironments(environments.filter((env) => env.id !== id));
    if (currentEnvironmentId === id) {
      setCurrentEnvironmentId(environments[0]?.id);
    }
  };

  const handleRenameEnvironment = async (id: string, name: string) => {
    const env = environments.find((e) => e.id === id);
    if (!env) return;
    await env.update({ name });
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
    setEnvironments([...environments, env]);
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

    await refetch();

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

    await refetch();

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
