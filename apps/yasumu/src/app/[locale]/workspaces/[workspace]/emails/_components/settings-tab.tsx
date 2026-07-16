'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SmtpConfig } from '@yasumu/core';
import { toast } from '@yasumu/ui/components/sonner';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { useEffect, useRef, useState } from 'react';

import { workspaceQueryKeys } from '@/app/[locale]/workspaces/[workspace]/_lib/workspace-query-keys';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import ErrorScreen from '@/components/visuals/error-screen';
import LoadingScreen from '@/components/visuals/loading-screen';

import SettingsForm from './settings-form';

interface SmtpDraft {
  workspaceId: string;
  username: string;
  password: string;
  port: number;
}

interface SmtpSaveFailure {
  workspaceId: string;
  error: Error;
}

export default function SettingsTab() {
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SmtpDraft | null>(null);
  const [saveFailure, setSaveFailure] = useState<SmtpSaveFailure | null>(null);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const latestSaveRevisionRef = useRef(0);
  const mountedRef = useRef(true);
  const activeWorkspaceIdRef = useRef(workspace.id);
  const configQueryKey = workspaceQueryKeys.smtpConfig(workspace.id);
  const portQueryKey = workspaceQueryKeys.smtpPort(workspace.id);

  activeWorkspaceIdRef.current = workspace.id;

  const {
    data: smtpConfig,
    isLoading: isLoadingConfig,
    error: configError,
  } = useQuery({
    queryKey: configQueryKey,
    queryFn: () => workspace.emails.getSmtpConfig(),
  });
  const { data: activeSmtpPort, isLoading: isLoadingSmtpPort } = useQuery({
    queryKey: portQueryKey,
    queryFn: () => workspace.emails.getSmtpPort().catch(() => null),
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const values: SmtpDraft =
    draft?.workspaceId === workspace.id
      ? draft
      : {
          workspaceId: workspace.id,
          username: smtpConfig?.username ?? '',
          password: smtpConfig?.password ?? '',
          port: smtpConfig?.port ?? 0,
        };
  const saveError = saveFailure?.workspaceId === workspace.id ? saveFailure.error : null;

  const updateDraft = (updates: Partial<Omit<SmtpDraft, 'workspaceId'>>) => {
    setDraft({ ...values, ...updates, workspaceId: workspace.id });
    setSaveFailure(null);
  };

  const handleSaveSettings = async () => {
    const revision = ++latestSaveRevisionRef.current;
    const submittedWorkspaceId = workspace.id;
    const submitted: Partial<SmtpConfig> = {
      username: values.username,
      password: values.password,
      port: Number.isFinite(values.port) ? values.port : 0,
    };

    setSaveFailure(null);
    const save = saveChainRef.current.catch(() => undefined).then(() => workspace.emails.updateSmtpConfig(submitted));
    saveChainRef.current = save;

    try {
      await save;
      queryClient.setQueryData<SmtpConfig>(configQueryKey, (current) => ({
        ...current,
        port: submitted.port ?? current?.port ?? 0,
        username: submitted.username ?? null,
        password: submitted.password ?? null,
      }));
      await queryClient.invalidateQueries({ queryKey: portQueryKey });

      if (
        mountedRef.current &&
        activeWorkspaceIdRef.current === submittedWorkspaceId &&
        revision === latestSaveRevisionRef.current
      ) {
        toast.success('SMTP server configuration updated');
      }
    } catch (error) {
      const failure = error instanceof Error ? error : new Error('Failed to save SMTP configuration');
      if (
        mountedRef.current &&
        activeWorkspaceIdRef.current === submittedWorkspaceId &&
        revision === latestSaveRevisionRef.current
      ) {
        setSaveFailure({ workspaceId: submittedWorkspaceId, error: failure });
      }
      throw failure;
    }
  };

  if (isLoadingConfig || isLoadingSmtpPort) {
    return <LoadingScreen message="Loading SMTP server configuration..." />;
  }

  if (configError) {
    return <ErrorScreen message="Failed to load SMTP server configuration" />;
  }

  return (
    <div className="h-full">
      {saveError && (
        <p role="alert" className="text-destructive px-8 pt-6 text-sm">
          {saveError.message}
        </p>
      )}
      <SettingsForm
        username={values.username}
        password={values.password}
        port={values.port}
        activePort={activeSmtpPort ?? undefined}
        onUsernameChange={(username) => updateDraft({ username })}
        onPasswordChange={(password) => updateDraft({ password })}
        onPortChange={(port) => updateDraft({ port: Number.isFinite(port) ? port : 0 })}
        onSave={withErrorHandler(handleSaveSettings)}
      />
    </div>
  );
}
