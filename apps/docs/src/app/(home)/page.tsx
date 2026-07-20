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
  Radio,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          }}
        />
        <div className="bg-fd-primary/8 absolute top-1/3 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="bg-fd-muted/50 border-fd-border text-fd-muted-foreground mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Open Source API Laboratory
        </div>

        <h1 className="text-fd-foreground mb-6 text-5xl font-black tracking-tight md:text-7xl lg:text-8xl">
          Yasumu
          <br />
          <span className="text-fd-muted-foreground">Documentation</span>
        </h1>

        <p className="text-fd-muted-foreground mb-12 max-w-2xl text-lg leading-relaxed md:text-xl">
          The comprehensive guide to the modern API laboratory.
          <br className="hidden md:block" />
          Design, test, and debug your API workflows with confidence.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/docs"
            className="group bg-fd-foreground text-fd-background hover:bg-fd-foreground/90 inline-flex items-center justify-center rounded-lg px-8 py-4 font-semibold transition-all duration-200"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="https://yasumu.dev/download"
            target="_blank"
            rel="noopener noreferrer"
            className="border-fd-border bg-fd-background hover:bg-fd-muted inline-flex items-center justify-center rounded-lg border px-8 py-4 font-semibold transition-all duration-200"
          >
            <Download className="mr-2 h-5 w-5" />
            Download
          </a>
        </div>

        <div className="text-fd-muted-foreground mt-16 flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            REST API
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            SMTP Testing
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            GraphQL
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            SSE
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="text-fd-foreground mb-4 text-3xl font-bold md:text-4xl">Explore the Documentation</h2>
          <p className="text-fd-muted-foreground mx-auto max-w-xl text-lg">
            Everything you need to master Yasumu, from basics to advanced concepts.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card
            href="/docs/getting-started"
            icon={<Book className="h-5 w-5" />}
            title="Getting Started"
            description="Install Yasumu and create your first workspace in minutes."
          />
          <Card
            href="/docs/workspaces"
            icon={<FolderOpen className="h-5 w-5" />}
            title="Workspaces"
            description="Understand how Yasumu organizes your API definitions."
          />
          <Card
            href="/docs/requests"
            icon={<Layers className="h-5 w-5" />}
            title="Requests"
            description="Master HTTP request configuration and testing."
          />
          <Card
            href="/docs/environments"
            icon={<Server className="h-5 w-5" />}
            title="Environments"
            description="Manage variables and secrets across different contexts."
          />
          <Card
            href="/docs/sse"
            icon={<Radio className="h-5 w-5" />}
            title="Server-Sent Events"
            description="Build, inspect, reconnect, script, and test streaming event requests."
          />
          <Card
            href="/docs/scripting"
            icon={<Code className="h-5 w-5" />}
            title="Scripting"
            description="Pre-request and post-response scripting with JavaScript."
          />
          <Card
            href="/docs/smtp-server"
            icon={<Mail className="h-5 w-5" />}
            title="SMTP Server"
            description="Catch-all email server for testing email workflows."
          />
          <Card
            href="/docs/echo-server"
            icon={<Server className="h-5 w-5" />}
            title="Echo Server"
            description="Built-in HTTP server for testing and debugging requests."
          />
          <Card
            href="/docs/cli"
            icon={<Terminal className="h-5 w-5" />}
            title="Command Line Interface"
            description="Execute YSL files from the terminal for CI/CD and automation."
          />
          <Card
            href="/docs/architecture"
            icon={<Cpu className="h-5 w-5" />}
            title="Architecture"
            description="Deep dive into the Tauri + custom runtime architecture."
          />
        </div>

        <div className="border-fd-border bg-fd-card mt-12 flex flex-col items-center justify-between gap-6 rounded-lg border p-6 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="bg-fd-muted rounded-lg p-3">
              <LifeBuoy className="text-fd-muted-foreground h-6 w-6" />
            </div>
            <div>
              <h3 className="mb-0.5 text-lg font-semibold">Need Help?</h3>
              <p className="text-fd-muted-foreground text-sm">
                Found a bug or have a feature request? Let us know on GitHub.
              </p>
            </div>
          </div>
          <a
            href="https://github.com/neplextech/yasumu/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-fd-foreground text-fd-background hover:bg-fd-foreground/90 inline-flex shrink-0 items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
          >
            Open an Issue
            <ExternalLink className="h-4 w-4" />
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
      className="group border-fd-border bg-fd-card hover:bg-fd-muted/50 hover:border-fd-muted-foreground/20 flex flex-col rounded-lg border p-5 transition-all duration-200"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="bg-fd-muted text-fd-muted-foreground group-hover:bg-fd-foreground/10 group-hover:text-fd-foreground rounded-md p-2 transition-colors">
          {icon}
        </div>
        <h3 className="text-fd-foreground font-semibold">{title}</h3>
      </div>
      <p className="text-fd-muted-foreground text-sm leading-relaxed">{description}</p>
      <div className="text-fd-muted-foreground group-hover:text-fd-foreground mt-auto flex items-center pt-4 text-sm font-medium transition-colors">
        Read more
        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
