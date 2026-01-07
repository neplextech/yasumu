'use client';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { useQueries } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yasumu/ui/components/select';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { Plus, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId } from 'react';
import { useEnvironmentStore } from '../../../_stores/environment-store';

export default function EnvironmentSelector() {
  const {
    environments,
    selectedEnvironment,
    setEnvironments,
    setSelectedEnvironment,
  } = useEnvironmentStore();
  const workspace = useActiveWorkspace();
  const router = useRouter();
  const nullId = useId();
  const [
    { data: environmentsData, isLoading: isLoadingEnvironments },
    { data: selectedEnvironmentData, isLoading: isLoadingSelectedEnvironment },
  ] = useQueries({
    queries: [
      {
        queryKey: ['environments'],
        queryFn: () => workspace.environments.list(),
        enabled: environments.length === 0,
      },
      {
        queryKey: ['selectedEnvironment'],
        queryFn: () => workspace.environments.getActiveEnvironment(),
        enabled: !selectedEnvironment,
      },
    ],
  });

  useEffect(() => {
    if (environmentsData) {
      setEnvironments(environmentsData);
    }
  }, [environmentsData]);

  useEffect(() => {
    if (selectedEnvironmentData === undefined) return;
    setSelectedEnvironment(selectedEnvironmentData);
  }, [selectedEnvironmentData]);

  return (
    <Select
      indicatorPosition="start"
      disabled={isLoadingEnvironments || isLoadingSelectedEnvironment}
      value={selectedEnvironment?.id}
      onValueChange={withErrorHandler(async (id) => {
        // Navigate to the environment management page
        if (id === nullId) {
          router.push('/en/workspaces/default/environment');
          return;
        }

        const targetEnvironment = environments.find((env) => env.id === id);

        if (targetEnvironment) {
          setSelectedEnvironment(targetEnvironment);
          await targetEnvironment.setActive();
        }
      })}
    >
      <SelectTrigger className="w-[180px] h-8">
        <SelectValue
          placeholder={
            isLoadingEnvironments || isLoadingSelectedEnvironment
              ? 'Loading...'
              : 'Select environment'
          }
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {environments.length ? (
            <>
              {environments.map((env) => (
                <SelectItem key={env.id} value={env.id}>
                  {env.name}
                </SelectItem>
              ))}
              <SelectItem
                value={nullId}
                className="pl-2 text-blue-500 focus:text-blue-500"
              >
                <Settings className="size-4" />
                Manage environments
              </SelectItem>
            </>
          ) : (
            <SelectItem
              value={nullId}
              className="pl-2 text-blue-500 focus:text-blue-500"
            >
              <Plus className="size-4" />
              Create new environment
            </SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
