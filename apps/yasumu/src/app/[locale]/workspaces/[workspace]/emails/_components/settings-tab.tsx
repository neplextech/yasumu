'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from '@yasumu/ui/components/sonner';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { useEffect, useState } from 'react';

import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import LoadingScreen from '@/components/visuals/loading-screen';

import SettingsForm from './settings-form';

export default function SettingsTab() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [port, setPort] = useState<number>();
  const workspace = useActiveWorkspace();
  const {
    data: activeSmtpPort,
    isLoading: isLoadingSmtpPort,
    refetch: refetchSmtpPort,
  } = useQuery({
    queryKey: ['smtp-port'],
    queryFn: () => workspace.emails.getSmtpPort().catch(() => null),
  });

  const handleSaveSettings = async () => {
    await workspace.emails.updateSmtpConfig({
      password,
      port,
      username,
    });

    toast.success('SMTP server configuration updated');
    await refetchSmtpPort();
  };

  if (isLoadingSmtpPort) {
    return <LoadingScreen message="Loading SMTP server configuration..." />;
  }

  return (
    <SettingsForm
      username={username}
      password={password}
      port={port ?? activeSmtpPort ?? 0}
      activePort={activeSmtpPort ?? undefined}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onPortChange={setPort}
      onSave={withErrorHandler(handleSaveSettings)}
    />
  );
}
