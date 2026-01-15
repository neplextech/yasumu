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
  Code,
  Terminal,
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
            href="/docs/scripting"
            icon={<Code className="w-5 h-5" />}
            title="Scripting"
            description="Pre-request and post-response scripting with JavaScript."
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
            href="/docs/cli"
            icon={<Terminal className="w-5 h-5" />}
            title="Command Line Interface"
            description="Execute YSL files from the terminal for CI/CD and automation."
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
