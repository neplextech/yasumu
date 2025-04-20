'use client';

import React, { useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CirclePlus, File, Trash } from 'lucide-react';
import { YasumuEnvironmentVariable } from '@yasumu/core';

interface Props {
  envVars: Array<YasumuEnvironmentVariable>;
  setEnvVars: (v: Array<YasumuEnvironmentVariable>) => void;
}

export function EnvVarsTable({ envVars, setEnvVars }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addAnother() {
    setEnvVars([
      ...envVars,
      {
        key: '',
        value: '',
        enabled: true,
      },
    ]);
  }

  function parseEnvContent(content: string) {
    const newEnvVars = content
      .split('\n')
      .map((c) => {
        if (c.trim().startsWith('#')) return null;
        const [key, value] = c.split('=');
        if (!key || !value) return null;

        // trim leading " and trailing " if they exist, also discard anything after # (comments)
        const val = (() => {
          const trimmed = value.trim();
          const quote = trimmed.startsWith('"') && trimmed.endsWith('"');
          const comment = trimmed.indexOf('#');
          if (quote) {
            return trimmed.slice(1, -1);
          } else if (comment > -1) {
            return trimmed.slice(0, comment);
          } else {
            return trimmed;
          }
        })();

        return { enabled: true, key, value: val || '' };
      })
      .filter(Boolean) as Array<YasumuEnvironmentVariable>;

    setEnvVars([...envVars, ...newEnvVars]);
  }

  function parseEnvFile(file: File) {
    const reader = new FileReader();

    reader.addEventListener('load', (event) => {
      const content = event.target?.result;
      if (typeof content !== 'string') return;

      parseEnvContent(content);
    });

    reader.readAsText(file);
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    parseEnvFile(file);
  }

  function handleFileDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const file = event.dataTransfer.files[0];
    if (!file) return;

    parseEnvFile(file);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const data = event.clipboardData.getData('text');
    const isEnvFileContent = /^[\w\d_]+=.+$/.test(data);
    if (isEnvFileContent) {
      event.preventDefault();
    }
    parseEnvContent(data);
  }

  return (
    <>
      <Table
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleFileDrop}
      >
        <TableHeader className="border">
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Value</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody className="border">
          {envVars.map((envVar) => {
            return (
              <TableRow key={envVar.key} className="border">
                <TableCell>
                  <Input
                    defaultValue={envVar.key}
                    placeholder="e.g. CLIENT_KEY"
                    className="py-3"
                    onPaste={handlePaste}
                  />
                </TableCell>
                <TableCell>
                  <Input defaultValue={envVar.value} className="py-3" />
                </TableCell>
                <TableCell>
                  <button className="hover:bg-secondary p-2">
                    <Trash className="size-[18px] text-red-500" />
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex gap-4 mt-7">
        <Button
          onClick={addAnother}
          variant="secondary"
          className="flex items-center"
        >
          <CirclePlus />
          <span>Add Another</span>
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="ghost"
          className="flex items-center"
        >
          <File /> <span>Import .env</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </>
  );
}
