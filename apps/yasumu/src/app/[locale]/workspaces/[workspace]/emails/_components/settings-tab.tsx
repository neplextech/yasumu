'use client';

import { useEffect, useState } from 'react';
import SettingsForm from './settings-form';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { toast } from '@yasumu/ui/components/sonner';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '@/components/visuals/loading-screen';

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
