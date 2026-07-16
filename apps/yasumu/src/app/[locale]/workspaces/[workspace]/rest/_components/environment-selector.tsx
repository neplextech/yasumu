'use client';
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

import {
  useActiveEnvironment,
  useEnvironments,
} from '@/app/[locale]/workspaces/[workspace]/environment/_hooks/useEnvironments';

import { useEnvironmentStore } from '../../../_stores/environment-store';

export default function EnvironmentSelector() {
  const environments = useEnvironmentStore((state) => state.environments);
  const selectedEnvironment = useEnvironmentStore((state) => state.selectedEnvironment);
  const setEnvironments = useEnvironmentStore((state) => state.setEnvironments);
  const setSelectedEnvironment = useEnvironmentStore((state) => state.setSelectedEnvironment);
  const router = useRouter();
  const nullId = useId();
  const { data: environmentsData, isLoading: isLoadingEnvironments } = useEnvironments();
  const { data: selectedEnvironmentData, isLoading: isLoadingSelectedEnvironment } = useActiveEnvironment();

  useEffect(() => {
    if (environmentsData) {
      setEnvironments(environmentsData);
    }
  }, [environmentsData, setEnvironments]);

  useEffect(() => {
    if (selectedEnvironmentData === undefined) return;
    setSelectedEnvironment(selectedEnvironmentData);
  }, [selectedEnvironmentData, setSelectedEnvironment]);

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
          await targetEnvironment.setActive();
          setSelectedEnvironment(targetEnvironment);
        }
      })}
    >
      <SelectTrigger className="h-8 w-[180px]">
        <SelectValue
          placeholder={isLoadingEnvironments || isLoadingSelectedEnvironment ? 'Loading...' : 'Select environment'}
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
              <SelectItem value={nullId} className="pl-2 text-blue-500 focus:text-blue-500">
                <Settings className="size-4" />
                Manage environments
              </SelectItem>
            </>
          ) : (
            <SelectItem value={nullId} className="pl-2 text-blue-500 focus:text-blue-500">
              <Plus className="size-4" />
              Create new environment
            </SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
