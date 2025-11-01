'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import WorkspaceProvider from './workspace-provider';
import { useTanxiumEvent } from '@/hooks/use-tanxium-event';
import { PermissionPromptProvider } from './permission-prompt-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  useTanxiumEvent();

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <NextIntlClientProvider locale="en" timeZone="UTC">
        <WorkspaceProvider>
          <PermissionPromptProvider>{children}</PermissionPromptProvider>
        </WorkspaceProvider>
      </NextIntlClientProvider>
    </NextThemesProvider>
  );
}
