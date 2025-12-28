import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@yasumu/ui/globals.css';
import './styles.css';
import Navbar from '../components/navbar';
import Footer from '../components/footer';

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
  description:
    'A modern, free, and open-source API laboratory for designing and testing API workflows.',
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
    <html
      lang="en"
      suppressHydrationWarning
      suppressContentEditableWarning
      className="dark"
    >
      <head>
        <link rel="icon" href="/logo-dark-glow.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background-dark text-gray-100 font-sans selection:bg-primary selection:text-white`}
      >
        <div className="min-h-screen flex flex-col relative">
          <Navbar />
          <main className="grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
