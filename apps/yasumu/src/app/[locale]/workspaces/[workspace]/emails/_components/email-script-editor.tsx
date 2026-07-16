'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type SmtpConfig, type YasumuEmbeddedScript, YasumuScriptingLanguage } from '@yasumu/core';
import { Button } from '@yasumu/ui/components/button';
import { Loader2 } from 'lucide-react';
import { useCallback } from 'react';
import { SiTypescript } from 'react-icons/si';

import { useSerializedAutosave } from '@/app/[locale]/workspaces/[workspace]/_hooks/use-serialized-autosave';
import { workspaceQueryKeys } from '@/app/[locale]/workspaces/[workspace]/_lib/workspace-query-keys';
import { TextEditor } from '@/components/editors';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import ErrorScreen from '@/components/visuals/error-screen';
import LoadingScreen from '@/components/visuals/loading-screen';
import { YASUMU_TYPE_DEFINITIONS } from '@/lib/types/yasumu-typedef';

import { EMAIL_SCRIPT_PLACEHOLDER, EMAIL_TYPEDEF } from './common';

const DEBOUNCE_DELAY = 3000;

const YASUMU_EMAIL_TYPEDEF = [
  ...YASUMU_TYPE_DEFINITIONS,
  {
    content: EMAIL_TYPEDEF,
    filePath: 'ts:yasumu/emails.d.ts',
  },
];

interface EmailScriptUpdate {
  code: string;
}

export default function EmailScriptEditor() {
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();
  const queryKey = workspaceQueryKeys.smtpConfig(workspace.id);
  const {
    data: smtpConfig,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => workspace.emails.getSmtpConfig(),
    staleTime: Infinity,
  });

  const persist = useCallback(
    async ({ code }: EmailScriptUpdate) => {
      await workspace.emails.updateSmtpConfig({
        script: { code, language: YasumuScriptingLanguage.JavaScript },
      });
    },
    [workspace.emails],
  );

  const { enqueue, flush, isSaving, saveError } = useSerializedAutosave<EmailScriptUpdate>({
    identityKey: `${workspace.id}:email-script`,
    persist,
    debounceMs: DEBOUNCE_DELAY,
  });

  const handleScriptCodeChange = useCallback(
    (code: string) => {
      if (!smtpConfig) return;
      const script: YasumuEmbeddedScript = {
        language: smtpConfig?.script?.language || YasumuScriptingLanguage.JavaScript,
        code,
      };
      queryClient.setQueryData<SmtpConfig>(queryKey, (current) => ({
        ...smtpConfig,
        ...current,
        script,
      }));
      enqueue({ code });
    },
    [enqueue, queryClient, queryKey, smtpConfig],
  );

  if (isLoading) {
    return <LoadingScreen fullScreen message="Loading email script..." />;
  }

  if (queryError || !smtpConfig) {
    return (
      <ErrorScreen
        fullScreen
        message="Failed to load the email script"
        action={
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex shrink-0 items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <SiTypescript className="size-4 bg-gray-200 text-blue-500" />
          <span className="text-muted-foreground text-sm font-medium">Email Script</span>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          {saveError && (
            <>
              <span role="alert" className="text-destructive max-w-64 truncate text-xs">
                {saveError.message}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving}
                onClick={() => void flush().catch(() => undefined)}
              >
                Retry save
              </Button>
            </>
          )}
          <span className="text-muted-foreground font-mono text-xs">onEmail(ctx)</span>
        </div>
      </div>
      <TextEditor
        value={smtpConfig?.script?.code || ''}
        onChange={handleScriptCodeChange}
        typeDefinitions={YASUMU_EMAIL_TYPEDEF}
        className="rounded-none"
        placeholder={
          <div className="text-muted-foreground ml-2 text-sm font-medium opacity-40">
            <h1 className="font-bold underline">Edit to hide this example placeholder</h1>
            <h1>Export onEmail to listen to new email event</h1>
            <h1>Example:</h1>
            <pre className="mt-4 font-mono text-sm whitespace-pre-wrap">{EMAIL_SCRIPT_PLACEHOLDER}</pre>
          </div>
        }
      />
    </div>
  );
}
