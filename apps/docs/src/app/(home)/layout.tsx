import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { Metadata } from 'next';

import { Footer } from '@/components/footer';
import { baseOptions } from '@/lib/layout.shared';

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

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout {...baseOptions()}>
      {children}
      <Footer />
    </HomeLayout>
  );
}
