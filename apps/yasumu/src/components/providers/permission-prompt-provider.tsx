'use client';
import { invoke } from '@tauri-apps/api/core';
import { event } from '@tauri-apps/api';
import { useState, useEffect } from 'react';
import { PermissionPrompt } from '../dialogs/permission-prompt-dialog';

export interface PermissionPromptEvent {
  custom_id: string;
  thread_id: string;
  prompt: {
    message: string;
    name: string;
    api_name: string | null;
    is_unary: boolean;
    response: 'Allow' | 'Deny' | 'AllowAll';
    stack: string[];
  };
}

export function PermissionPromptProvider({
  children,
}: React.PropsWithChildren) {
  const [pendingPrompts, setPendingPrompts] = useState<PermissionPromptEvent[]>(
    [],
  );

  useEffect(() => {
    const permissionPromptHandler = event.listen<PermissionPromptEvent>(
      'permission-prompt',
      async (event) => {
        console.log({ permissionPrompt: event.payload });
        try {
          setPendingPrompts((p) => [...p, event.payload]);
        } catch (error) {
          console.error('Failed to parse permission prompt event', error);
        }
      },
    );

    return () => {
      permissionPromptHandler.then((remove) => remove());
    };
  }, []);

  const handlePermissionResponse = async (
    prompt: PermissionPromptEvent,
    response: PermissionPromptEvent['prompt']['response'],
  ) => {
    await invoke('respond_to_permission_prompt', {
      threadId: prompt.thread_id,
      response: response || 'Deny',
    }).catch((e) => {
      console.error('Failed to respond to permission prompt', e);
    });

    setPendingPrompts((p) => p.filter((p) => p.custom_id !== prompt.custom_id));
  };

  const nextPrompt = pendingPrompts[0];

  if (!nextPrompt) return <>{children}</>;

  return (
    <>
      {/* Sequentially render the permission prompts until all are resolved */}
      {nextPrompt && (
        <PermissionPrompt
          event={nextPrompt}
          onConfirm={handlePermissionResponse}
        />
      )}
      {children}
    </>
  );
}
