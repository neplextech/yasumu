'use client';

import { useState } from 'react';
import SettingsForm from './settings-form';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { toast } from '@yasumu/ui/components/sonner';
import { useQuery } from '@tanstack/react-query';

export default function SettingsTab() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [port, setPort] = useState<number>(0);
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

  return (
    <SettingsForm
      username={username}
      password={password}
      port={port}
      activePort={activeSmtpPort ?? undefined}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onPortChange={setPort}
      onSave={withErrorHandler(handleSaveSettings)}
    />
  );
}
