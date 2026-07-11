'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { YasumuScriptingLanguage } from '@yasumu/core';
import type { YasumuEmbeddedScript } from '@yasumu/core';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { SiTypescript } from 'react-icons/si';

import { TextEditor } from '@/components/editors';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
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

export default function EmailScriptEditor() {
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();
  const pendingCodeRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: script } = useQuery({
    queryKey: ['email-script'],
    queryFn: () => workspace.emails.getSmtpConfig().then((c) => c.script ?? null),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { mutate: saveScript, isPending: isSaving } = useMutation({
    mutationKey: ['update-email-script'],
    mutationFn: (code: string) =>
      workspace.emails.updateSmtpConfig({
        script: { code, language: YasumuScriptingLanguage.JavaScript },
      }),
    onSuccess: () => {
      pendingCodeRef.current = null;
    },
  });

  const flushPendingChanges = useCallback(() => {
    if (pendingCodeRef.current !== null) {
      saveScript(pendingCodeRef.current);
    }
  }, [saveScript]);

  const handleScriptCodeChange = useCallback(
    (code: string) => {
      pendingCodeRef.current = code;

      queryClient.setQueryData<YasumuEmbeddedScript | null>(['email-script'], (old) => ({
        language: old?.language || YasumuScriptingLanguage.JavaScript,
        code,
      }));

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        flushPendingChanges();
        debounceTimerRef.current = null;
      }, DEBOUNCE_DELAY);
    },
    [queryClient, flushPendingChanges],
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (pendingCodeRef.current !== null) {
        workspace.emails.updateSmtpConfig({
          script: {
            code: pendingCodeRef.current,
            language: YasumuScriptingLanguage.JavaScript,
          },
        });
      }
    };
  }, [workspace.emails]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex shrink-0 items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <SiTypescript className="size-4 bg-gray-200 text-blue-500" />
          <span className="text-muted-foreground text-sm font-medium">Email Script</span>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          <span className="text-muted-foreground font-mono text-xs">onEmail(ctx, email)</span>
        </div>
      </div>
      <TextEditor
        value={script?.code || ''}
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
