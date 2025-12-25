'use client';
import React, { useId } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yasumu/ui/components/select';
import { useRouter } from 'next/navigation';
import { useEnvironmentStore } from '../../../_stores/environment-store';
import { Check } from 'lucide-react';

export default function EnvironmentSelector() {
  const { environments, selectedEnvironmentId, setSelectedEnvironmentId } =
    useEnvironmentStore();
  const router = useRouter();
  const nullId = useId();

  return (
    <Select
      value={selectedEnvironmentId ?? undefined}
      onValueChange={(id) => {
        if (id === nullId) {
          router.push('/en/workspaces/default/environment');
          return;
        }
        setSelectedEnvironmentId(id);
      }}
    >
      <SelectTrigger className="w-[180px] h-8">
        <SelectValue placeholder="Environment" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {environments.length ? (
            environments.map((env) => (
              <SelectItem key={env.id} value={env.id}>
                {env.id === selectedEnvironmentId ? (
                  <Check className="size-4" />
                ) : (
                  ''
                )}{' '}
                {env.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem
              value={nullId}
              className="pl-2 text-blue-500 focus:text-blue-500"
            >
              Create new environment
            </SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
