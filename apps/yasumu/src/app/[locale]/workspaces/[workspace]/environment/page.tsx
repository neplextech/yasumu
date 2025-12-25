'use client';

import { useState, useEffect } from 'react';
import { Separator } from '@yasumu/ui/components/separator';
import VariablesTable from './_components/variables-table';
import SecretsTable from './_components/secrets-table';
import EnvironmentList from './_components/environment-list';
import {
  useEnvironmentStore,
  Environment,
  Variable,
} from '../../_stores/environment-store';

export default function EnvironmentPage() {
  const {
    environments,
    addEnvironment,
    deleteEnvironment,
    setVariables,
    setSecrets,
  } = useEnvironmentStore();
  const [selectedEnvironmentId, setSelectedEnvironmentId] =
    useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (environments.length > 0) {
      const exists = environments.find((e) => e.id === selectedEnvironmentId);
      if (!selectedEnvironmentId || !exists) {
        setSelectedEnvironmentId(environments[0].id);
      }
    }
  }, [environments, selectedEnvironmentId, isMounted]);

  const selectedEnvironment = environments.find(
    (e) => e.id === selectedEnvironmentId,
  );

  const handleAddEnvironment = (name: string) => {
    const newEnv: Environment = {
      id: Date.now().toString(),
      name,
      variables: [{ key: '', value: '', enabled: true }],
      secrets: [{ key: '', value: '', enabled: true }],
    };
    addEnvironment(newEnv);
    setSelectedEnvironmentId(newEnv.id);
  };

  const handleDeleteEnvironment = (id: string) => {
    if (environments.length > 1) {
      deleteEnvironment(id);
    }
  };

  const handleVariablesChange = (variables: Variable[]) => {
    if (selectedEnvironmentId) {
      setVariables(selectedEnvironmentId, variables);
    }
  };

  const handleSecretsChange = (secrets: Variable[]) => {
    if (selectedEnvironmentId) {
      setSecrets(selectedEnvironmentId, secrets);
    }
  };

  if (!isMounted) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex h-full bg-background">
      <div className="w-[280px] shrink-0">
        <EnvironmentList
          environments={environments}
          selectedEnvironmentId={selectedEnvironmentId}
          onSelectEnvironment={setSelectedEnvironmentId}
          onAddEnvironment={handleAddEnvironment}
          onDeleteEnvironment={handleDeleteEnvironment}
          canDelete={environments.length > 1}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedEnvironment ? (
          <div className="flex-1 overflow-auto p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold">
                  {selectedEnvironment.name}
                </h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Environment
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage variables and secrets for this environment
              </p>
            </div>
            <Separator />
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Variables</h3>
                <VariablesTable
                  variables={selectedEnvironment.variables || []}
                  onChange={handleVariablesChange}
                />
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Secrets</h3>
                <SecretsTable
                  secrets={selectedEnvironment.secrets || []}
                  onChange={handleSecretsChange}
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
