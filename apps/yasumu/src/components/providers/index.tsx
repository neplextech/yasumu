'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
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
      <NextIntlClientProvider locale="en">
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </NextIntlClientProvider>
    </NextThemesProvider>
  );
}
