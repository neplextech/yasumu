'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import * as React from 'react';

import { CommandPaletteProvider, CommandPalette } from '../command';
import { AppLayoutProvider } from './app-layout-provider';
import { CustomThemeProvider } from './custom-theme-provider';
import { DisableContextMenu } from './disable-context-menu';
import { FrontendReadyProvider } from './frontend-ready-provider';
import { QueryClientProvider } from './query-client-provider';
import UpdaterProvider from './updater-provider';
import WorkspaceProvider from './workspace-provider';

export function Providers({ children }: { children: React.ReactNode }) {
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
                        <FrontendReadyProvider>{children}</FrontendReadyProvider>
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
