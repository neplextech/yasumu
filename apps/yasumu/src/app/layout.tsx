import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { JetBrains_Mono, Poppins } from 'next/font/google';
import { AppSidebar } from '@/components/sidebars/AppSidebar';
import LayoutGroup from '@/components/LayoutGroup';
import ThemeProvider from '@/providers/ThemeProvider';
import WorkspaceProvider from '@/providers/WorkspaceProvider';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = { title: 'Yasumu' };

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      suppressContentEditableWarning
      className={`${poppins.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="select-none h-screen">
        <ThemeProvider>
          <Toaster />
          <WorkspaceProvider>
            <LayoutGroup>
              <SidebarProvider>
                <AppSidebar />
                {children}
              </SidebarProvider>
            </LayoutGroup>
          </WorkspaceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
