import React from 'react';
import Link from 'next/link';
import {
  Book,
  Code2,
  Terminal,
  Cpu,
  Layers,
  Download,
  ArrowRight,
  Zap,
  LifeBuoy,
} from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center bg-linear-to-b from-transparent to-muted/20">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
          Yasumu <span className="text-fd-primary">Documentation</span>
        </h1>

        <p className="text-fd-muted-foreground text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          The comprehensive guide to the modern API laboratory.
          <br className="hidden md:block" />
          Learn to design, test, and debug workflows with efficiency.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/docs"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium hover:bg-fd-primary/90 transition-colors shadow-sm"
          >
            Get Started <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <a
            href="https://yasumu.dev/download"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-fd-border bg-fd-card hover:bg-fd-accent hover:text-fd-accent-foreground transition-colors font-medium"
          >
            <Download className="mr-2 w-4 h-4" />
            Download
          </a>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Browse Topics</h2>
          <div className="h-1 w-20 bg-fd-primary rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            href="/docs"
            icon={<Book className="w-6 h-6" />}
            title="Getting Started"
            description="Installation guides and initial setup to get you running in minutes."
          />
          <Card
            href="/docs"
            icon={<Layers className="w-6 h-6" />}
            title="Core Concepts"
            description="Understand Workspaces, Requests, and Environments in Yasumu."
          />
          <Card
            href="/docs"
            icon={<Code2 className="w-6 h-6" />}
            title="Developer Guides"
            description="Learn about code generation, scripting, and advanced testing."
          />
          <Card
            href="/docs"
            icon={<Cpu className="w-6 h-6" />}
            title="Architecture"
            description="Deep dive into the Tauri + Deno architecture that powers Yasumu."
          />
          <Card
            href="/docs"
            icon={<Zap className="w-6 h-6" />}
            title="Shortcuts"
            description="Boost your productivity with keyboard shortcuts and quick actions."
          />
          <Card
            href="https://github.com/neplextech/yasumu/issues"
            icon={<LifeBuoy className="w-6 h-6" />}
            title="Support"
            description="Found a bug? Have a feature request? Let us know on GitHub."
            external
          />
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
  external,
}: {
  href: string;
  icon: React.ReactElement;
  title: string;
  description: string;
  external?: boolean;
}) {
  const Component = external ? 'a' : Link;
  const props = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Component
      href={href}
      {...props}
      className="group flex flex-col p-6 rounded-xl border border-fd-border bg-fd-card hover:border-fd-primary/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300">
        {React.cloneElement(
          icon as React.ReactElement<{ className?: string }>,
          { className: 'w-24 h-24' },
        )}
      </div>

      <div className="relative z-10">
        <div className="mb-4 text-fd-primary bg-fd-primary/10 w-fit p-3 rounded-lg group-hover:bg-fd-primary/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2 group-hover:text-fd-primary transition-colors">
          {title}
        </h3>
        <p className="text-fd-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </Component>
  );
}
