import React from 'react';
import Link from 'next/link';
import {
  Book,
  Cpu,
  Layers,
  Download,
  ArrowRight,
  LifeBuoy,
  Server,
  FolderOpen,
  Mail,
  ExternalLink,
} from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-[calc(100vh-64px)] overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(ellipse at center, black 30%, transparent 70%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-fd-primary/8 rounded-full blur-[100px]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fd-muted/50 border border-fd-border text-fd-muted-foreground text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Open Source API Laboratory
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight text-fd-foreground">
          Yasumu
          <br />
          <span className="text-fd-muted-foreground">Documentation</span>
        </h1>

        <p className="text-fd-muted-foreground text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
          The comprehensive guide to the modern API laboratory.
          <br className="hidden md:block" />
          Design, test, and debug your API workflows with confidence.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/docs"
            className="group inline-flex items-center justify-center px-8 py-4 rounded-lg bg-fd-foreground text-fd-background font-semibold hover:bg-fd-foreground/90 transition-all duration-200"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="https://yasumu.dev/download"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg border border-fd-border bg-fd-background hover:bg-fd-muted transition-all duration-200 font-semibold"
          >
            <Download className="mr-2 w-5 h-5" />
            Download
          </a>
          <a
            href="https://github.com/neplextech/yasumu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg border border-fd-border bg-fd-background hover:bg-fd-muted transition-all duration-200 font-semibold"
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 496 512"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 w-5 h-5"
            >
              <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path>
            </svg>
            GitHub
          </a>
        </div>

        <div className="mt-16 flex items-center gap-8 text-sm text-fd-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            REST API
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            SMTP Testing
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            GraphQL
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-fd-foreground">
            Explore the Documentation
          </h2>
          <p className="text-fd-muted-foreground text-lg max-w-xl mx-auto">
            Everything you need to master Yasumu, from basics to advanced
            concepts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            href="/docs/getting-started"
            icon={<Book className="w-5 h-5" />}
            title="Getting Started"
            description="Install Yasumu and create your first workspace in minutes."
          />
          <Card
            href="/docs/workspaces"
            icon={<FolderOpen className="w-5 h-5" />}
            title="Workspaces"
            description="Understand how Yasumu organizes your API definitions."
          />
          <Card
            href="/docs/requests"
            icon={<Layers className="w-5 h-5" />}
            title="Requests"
            description="Master HTTP request configuration and testing."
          />
          <Card
            href="/docs/environments"
            icon={<Server className="w-5 h-5" />}
            title="Environments"
            description="Manage variables and secrets across different contexts."
          />
          <Card
            href="/docs/smtp-server"
            icon={<Mail className="w-5 h-5" />}
            title="SMTP Server"
            description="Catch-all email server for testing email workflows."
          />
          <Card
            href="/docs/echo-server"
            icon={<Server className="w-5 h-5" />}
            title="Echo Server"
            description="Built-in HTTP server for testing and debugging requests."
          />
          <Card
            href="/docs/architecture"
            icon={<Cpu className="w-5 h-5" />}
            title="Architecture"
            description="Deep dive into the Tauri + custom runtime architecture."
          />
        </div>

        <div className="mt-12 p-6 rounded-lg border border-fd-border bg-fd-card flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-fd-muted">
              <LifeBuoy className="w-6 h-6 text-fd-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-0.5">Need Help?</h3>
              <p className="text-fd-muted-foreground text-sm">
                Found a bug or have a feature request? Let us know on GitHub.
              </p>
            </div>
          </div>
          <a
            href="https://github.com/neplextech/yasumu/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-fd-foreground text-fd-background font-medium hover:bg-fd-foreground/90 transition-colors shrink-0 text-sm"
          >
            Open an Issue
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </main>
  );
}

function Card({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactElement;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col p-5 rounded-lg border border-fd-border bg-fd-card hover:bg-fd-muted/50 hover:border-fd-muted-foreground/20 transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-md bg-fd-muted text-fd-muted-foreground group-hover:bg-fd-foreground/10 group-hover:text-fd-foreground transition-colors">
          {icon}
        </div>
        <h3 className="font-semibold text-fd-foreground">{title}</h3>
      </div>
      <p className="text-fd-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
      <div className="mt-auto pt-4 flex items-center text-sm font-medium text-fd-muted-foreground group-hover:text-fd-foreground transition-colors">
        Read more
        <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
