'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import WorkspaceProvider from './workspace-provider';
import { useTanxiumEvent } from '@/hooks/use-tanxium-event';
import { PermissionPromptProvider } from './permission-prompt-provider';
import { AppLayoutProvider } from './app-layout-provider';
import { QueryClientProvider } from './query-client-provider';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

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
        <NuqsAdapter>
          <AppLayoutProvider>
            <QueryClientProvider>
              <WorkspaceProvider>
                <PermissionPromptProvider>{children}</PermissionPromptProvider>
              </WorkspaceProvider>
            </QueryClientProvider>
          </AppLayoutProvider>
        </NuqsAdapter>
      </NextIntlClientProvider>
    </NextThemesProvider>
  );
}
