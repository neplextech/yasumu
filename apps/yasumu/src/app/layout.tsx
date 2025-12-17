import '@yasumu/ui/globals.css';
import { JetBrains_Mono, Poppins } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from '@yasumu/ui/components/sonner';
import LayoutGroup from '@/components/layout/layout-group';
import { SidebarProvider } from '@yasumu/ui/components/sidebar';
import { AppSidebar } from '@/components/sidebars/app-sidebar';
import { TitleBar } from '@/components/layout/title-bar';

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
        className={`${poppins.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          <TitleBar />
          <div className="pt-[30px] h-screen w-full">
            <Toaster />
            <LayoutGroup>
              <SidebarProvider>
                <AppSidebar />
                {children}
              </SidebarProvider>
            </LayoutGroup>
          </div>
        </Providers>
      </body>
    </html>
  );
}
