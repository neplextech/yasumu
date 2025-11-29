'use client';

import { useState } from 'react';
import { Separator } from '@yasumu/ui/components/separator';
import VariablesTable from './_components/variables-table';
import SecretsTable from './_components/secrets-table';
import EnvironmentList from './_components/environment-list';

interface Variable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface Secret {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  visible: boolean;
}

interface Environment {
  id: string;
  name: string;
  variables: Variable[];
  secrets: Secret[];
}

const mockEnvironments: Environment[] = [
  {
    id: '1',
    name: 'Production',
    variables: [
      {
        id: 'v1',
        key: 'API_URL',
        value: 'https://api.production.com',
        enabled: true,
      },
      { id: 'v2', key: 'ENV', value: 'production', enabled: true },
    ],
    secrets: [
      {
        id: 's1',
        key: 'API_KEY',
        value: 'prod-api-key-12345',
        enabled: true,
        visible: false,
      },
      {
        id: 's2',
        key: 'DATABASE_PASSWORD',
        value: 'prod-db-pass',
        enabled: true,
        visible: false,
      },
    ],
  },
  {
    id: '2',
    name: 'Local',
    variables: [
      {
        id: 'v3',
        key: 'API_URL',
        value: 'http://localhost:3000',
        enabled: true,
      },
      { id: 'v4', key: 'ENV', value: 'development', enabled: true },
    ],
    secrets: [
      {
        id: 's3',
        key: 'API_KEY',
        value: 'dev-api-key-12345',
        enabled: true,
        visible: false,
      },
    ],
  },
];

export default function EnvironmentPage() {
  const [environments, setEnvironments] =
    useState<Environment[]>(mockEnvironments);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>(
    mockEnvironments[0].id,
  );

  const selectedEnvironment = environments.find(
    (e) => e.id === selectedEnvironmentId,
  );

  const handleAddEnvironment = (name: string) => {
    const newEnv: Environment = {
      id: Date.now().toString(),
      name,
      variables: [
        { id: Date.now().toString(), key: '', value: '', enabled: true },
      ],
      secrets: [
        {
          id: (Date.now() + 1).toString(),
          key: '',
          value: '',
          enabled: true,
          visible: false,
        },
      ],
    };
    setEnvironments([...environments, newEnv]);
    setSelectedEnvironmentId(newEnv.id);
  };

  const handleDeleteEnvironment = (id: string) => {
    if (environments.length > 1) {
      const updated = environments.filter((e) => e.id !== id);
      setEnvironments(updated);
      if (selectedEnvironmentId === id) {
        setSelectedEnvironmentId(updated[0].id);
      }
    }
  };

  const handleVariablesChange = (variables: Variable[]) => {
    if (selectedEnvironment) {
      const updated = environments.map((e) =>
        e.id === selectedEnvironment.id ? { ...e, variables } : e,
      );
      setEnvironments(updated);
    }
  };

  const handleSecretsChange = (secrets: Secret[]) => {
    if (selectedEnvironment) {
      const updated = environments.map((e) =>
        e.id === selectedEnvironment.id ? { ...e, secrets } : e,
      );
      setEnvironments(updated);
    }
  };

  return (
    <div className="flex h-full bg-background">
      <div className="w-[280px] shrink-0">
        <EnvironmentList
          environments={environments.map((e) => ({ id: e.id, name: e.name }))}
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
                  variables={selectedEnvironment.variables}
                  onChange={handleVariablesChange}
                />
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Secrets</h3>
                <SecretsTable
                  secrets={selectedEnvironment.secrets}
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
              <p className="text-sm">Select an environment from the list</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
