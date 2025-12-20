'use client';

import React, { useMemo } from 'react';
import { ResponseStatusBar, ResponseTabs } from '@/components/responses';
import { useRestOutput } from '../_providers/rest-output';
import LoadingScreen from '@/components/visuals/loading-screen';
import YasumuBackgroundArt from '@/components/visuals/yasumu-background-art';

export default function OutputConsole() {
  const { output, isLoading } = useRestOutput();

  const prettifiedJson = useMemo(() => {
    if (!output?.headers) return '';
    try {
      const contentType = Object.entries(output?.headers ?? {}).find(
        ([key]) => key.toLowerCase() === 'content-type',
      )?.[1];
      if (contentType !== 'application/json') return output.body;
      return JSON.stringify(JSON.parse(output.body ?? '{}'), null, 2);
    } catch (e) {
      console.error(e);
      return 'Failed to load preview';
    }
  }, [output?.body]);

  if (isLoading) {
    return <LoadingScreen fullScreen />;
  }

  if (!output) return null;

  return (
    <div className="flex flex-col h-full border-t bg-background">
      <ResponseStatusBar
        status={output?.status ?? 0}
        statusText={output?.statusText ?? ''}
        time={(output?.time ?? 0).toFixed(2)}
      />
      <ResponseTabs
        prettyContent={prettifiedJson}
        rawContent={output.raw}
        headers={output.headers}
      />
    </div>
  );
}
