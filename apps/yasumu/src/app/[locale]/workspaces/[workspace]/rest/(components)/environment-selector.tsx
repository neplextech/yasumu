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

export default function EnvironmentSelector() {
  const router = useRouter();
  const nullId = useId();
  const [selectedEnvironment, setSelectedEnvironment] = React.useState<
    string | null
  >(null);
  const [environments, setEnvironments] = React.useState<
    {
      id: string;
      name: string;
    }[]
  >([
    { id: 'nightly', name: 'Nightly' },
    { id: 'staging', name: 'Staging' },
    { id: 'production', name: 'Production' },
  ]);

  return (
    <Select
      value={selectedEnvironment ?? undefined}
      onValueChange={(id) => {
        if (id === nullId) {
          router.push('/');
          return;
        }
        setSelectedEnvironment(id);
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
