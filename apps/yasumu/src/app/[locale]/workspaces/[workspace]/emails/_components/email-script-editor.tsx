'use client';
import { TextEditor } from '@/components/editors';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { YASUMU_TYPE_DEFINITIONS } from '@/lib/types/yasumu-typedef';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { YasumuScriptingLanguage } from '@yasumu/core';
import { EMAIL_SCRIPT_PLACEHOLDER, EMAIL_TYPEDEF } from './common';
import { useCallback, useEffect, useRef } from 'react';
import type { YasumuEmbeddedScript } from '@yasumu/common';
import { Loader2 } from 'lucide-react';
import { SiTypescript } from 'react-icons/si';

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
    queryFn: () =>
      workspace.emails.getSmtpConfig().then((c) => c.script ?? null),
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

      queryClient.setQueryData<YasumuEmbeddedScript | null>(
        ['email-script'],
        (old) => ({
          language: old?.language || YasumuScriptingLanguage.JavaScript,
          code,
        }),
      );

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
    <div className="flex flex-col gap-2 min-h-0 h-full">
      <div className="flex items-center justify-between shrink-0 px-8">
        <div className="flex items-center gap-2">
          <SiTypescript className="size-4 text-blue-500 bg-gray-200" />
          <span className="text-sm text-muted-foreground font-medium">
            Email Script
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          <span className="text-xs text-muted-foreground font-mono">
            onEmail(ctx, email)
          </span>
        </div>
      </div>
      <TextEditor
        value={script?.code || ''}
        onChange={handleScriptCodeChange}
        typeDefinitions={YASUMU_EMAIL_TYPEDEF}
        className="rounded-none"
        placeholder={
          <div className="text-sm text-muted-foreground font-medium opacity-40 ml-2">
            <h1 className="font-bold underline">
              Edit to hide this example placeholder
            </h1>
            <h1>Export onEmail to listen to new email event</h1>
            <h1>Example:</h1>
            <pre className="font-mono text-sm whitespace-pre-wrap mt-4">
              {EMAIL_SCRIPT_PLACEHOLDER}
            </pre>
          </div>
        }
      />
    </div>
  );
}
