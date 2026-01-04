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
import UpdaterProvider from './updater-provider';
import { CustomThemeProvider } from './custom-theme-provider';
import { CommandPaletteProvider, CommandPalette } from '../command';
import { DisableContextMenu } from './disable-context-menu';

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
      <CustomThemeProvider>
        <DisableContextMenu>
          <NextIntlClientProvider locale="en" timeZone="UTC">
            <NuqsAdapter>
              <UpdaterProvider>
                <QueryClientProvider>
                  <AppLayoutProvider>
                    <CommandPaletteProvider>
                      <WorkspaceProvider>
                        <CommandPalette />
                        <PermissionPromptProvider>
                          {children}
                        </PermissionPromptProvider>
                      </WorkspaceProvider>
                    </CommandPaletteProvider>
                  </AppLayoutProvider>
                </QueryClientProvider>
              </UpdaterProvider>
            </NuqsAdapter>
          </NextIntlClientProvider>
        </DisableContextMenu>
      </CustomThemeProvider>
    </NextThemesProvider>
  );
}
