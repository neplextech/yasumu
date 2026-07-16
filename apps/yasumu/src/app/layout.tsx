import '@yasumu/ui/globals.css';
import { SidebarProvider } from '@yasumu/ui/components/sidebar';
import { Toaster } from '@yasumu/ui/components/sonner';
import { JetBrains_Mono, Poppins } from 'next/font/google';

import LayoutGroup from '@/components/layout/layout-group';
import { StatusBar } from '@/components/layout/status-bar/index';
import { TitleBar } from '@/components/layout/title-bar';
import { Providers } from '@/components/providers';
import { AppSidebar } from '@/components/sidebars/app-sidebar';

const poppins = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  weight: 'variable',
  display: 'swap',
  variable: '--font-mono',
  subsets: ['latin'],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning suppressContentEditableWarning>
      <body
        className={`${poppins.variable} ${jetbrainsMono.variable} flex h-screen w-screen flex-col overflow-hidden font-sans antialiased`}
      >
        <Providers>
          <TitleBar />
          <div className="min-h-0 w-full flex-1 overflow-hidden">
            <Toaster />
            <LayoutGroup>
              <SidebarProvider className="h-full min-h-0">
                <AppSidebar />
                {children}
              </SidebarProvider>
            </LayoutGroup>
          </div>
          <StatusBar />
        </Providers>
      </body>
    </html>
  );
}
