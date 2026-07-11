import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

import '@yasumu/ui/globals.css';
import './styles.css';
import Footer from '../components/footer';
import Navbar from '../components/navbar';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Yasumu - The Modern API Laboratory',
  description: 'A modern, free, and open-source API laboratory for designing and testing API workflows.',
  openGraph: {
    images: '/logo-dark-glow.png',
  },
  twitter: {
    images: '/logo-dark-glow.png',
  },
  keywords: [
    'Yasumu',
    'Neplex',
    'API Laboratory',
    'API Design',
    'API Development',
    'API Documentation',
    'API Client',
    'API Testing',
    'Open Source',
    'Rest',
    'Smtp',
    'Graphql',
    'WebSocket',
    'Server-Sent Events',
    'Socket.IO',
    'Plugins',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning suppressContentEditableWarning className="dark">
      <head>
        <link rel="icon" href="/logo-dark-glow.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} bg-background-dark selection:bg-primary font-sans text-gray-100 antialiased selection:text-white`}
      >
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="grow">{children}</main>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
