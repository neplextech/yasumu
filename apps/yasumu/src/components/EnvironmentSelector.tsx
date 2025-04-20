'use client';
import React, { useEffect, useId } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useYasumu } from '@/providers/WorkspaceProvider';
import { YasumuEnvironment } from '@yasumu/core';
import { useRouter } from 'next/navigation';

export default function EnvironmentSelector() {
  const { yasumu } = useYasumu();
  const router = useRouter();
  const nullId = useId();
  const [selectedEnvironment, setSelectedEnvironment] = React.useState<
    string | null
  >(null);
  const [environments, setEnvironments] = React.useState<YasumuEnvironment[]>(
    [],
  );
  const currentEnvironment =
    yasumu.workspace?.environments.getSelectedEnvironment();

  useEffect(() => {
    if (selectedEnvironment) {
      yasumu.workspace?.environments
        .selectEnvironment(selectedEnvironment)
        .catch(Object);
    }
  }, [yasumu.workspace?.environments, selectedEnvironment]);

  useEffect(() => {
    setEnvironments(yasumu.workspace?.environments.getEnvironments() ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Select
      value={currentEnvironment?.id}
      onValueChange={(id) => {
        if (id === nullId) {
          router.push('/environment');
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
