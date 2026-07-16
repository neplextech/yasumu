import { Button } from '@yasumu/ui/components/button';
import Link from 'next/link';
import React from 'react';
import { FaArrowRight, FaDownload, FaGithub } from 'react-icons/fa6';
import { MdCode, MdBolt, MdTerminal, MdLock, MdFolderOpen, MdPublic } from 'react-icons/md';
import { SiDeno, SiRust, SiTauri, SiTypescript } from 'react-icons/si';

import AppPreview from '../components/app-preview';
import { BackgroundGrid } from '../components/background-grid';

export default function Home() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
        <BackgroundGrid />
        <div className="from-background-dark absolute inset-0 z-0 bg-gradient-to-t via-transparent to-transparent"></div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Link
            href="/changelog"
            className="group mb-8 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-sm transition-colors hover:border-white/20"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            <span className="font-mono text-xs font-medium text-gray-300 transition-colors group-hover:text-white">
              Now in public beta
            </span>
          </Link>

          <h1 className="mb-8 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-7xl">
            The Modern API Laboratory
          </h1>

          <p className="text-text-secondary mx-auto mt-4 max-w-2xl text-xl leading-relaxed">
            Design, test, and automate API workflows with a fast, open-source desktop app and headless CLI. One
            git-friendly workspace behaves consistently on your machine and in CI.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-lg bg-white px-8 text-base font-medium text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:bg-gray-200 hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]"
            >
              <Link href="/download">
                <FaDownload className="mr-2 text-xl" />
                Download for Free
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-lg border-white/20 bg-white/5 px-8 text-base font-medium text-gray-300 backdrop-blur-sm hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              <a href="https://github.com/neplextech/yasumu">
                <FaGithub className="mr-2 text-xl" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="bg-primary/20 pointer-events-none absolute -top-32 left-1/2 h-96 w-[80%] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"></div>
          <AppPreview />
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-surface-dark border-t border-white/5 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-20 max-w-3xl text-center">
            <h2 className="mb-3 font-mono text-sm font-semibold tracking-widest text-blue-400 uppercase">
              Core Features
            </h2>
            <p className="mb-6 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Everything you need for API development
            </p>
            <p className="text-text-secondary text-lg leading-relaxed">
              Built with performance and user experience in mind. Yasumu removes the clutter so you can focus on the
              data.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<MdBolt />}
              color="blue"
              title="Lightweight & Fast"
              description="A Tauri desktop shell, Tanxium scripting runtime, and shared headless execution engine without the weight of an Electron app."
            />
            <FeatureCard
              icon={<MdTerminal />}
              color="purple"
              title="Desktop and CLI"
              description="Run the same REST and GraphQL requests, scripts, tests, files, variables, and mocks interactively or in automated CI jobs."
            />
            <FeatureCard
              icon={<MdLock />}
              color="green"
              title="Offline First"
              description="Your data stays on your machine. No cloud sync required. Complete privacy."
            />
            <FeatureCard
              icon={<MdCode />}
              color="orange"
              title="Portable Scripting"
              description="Use standard Web Request and Response APIs, typed hooks, request chaining, virtual modules, email waits, and isolated runtimes."
            />
            <FeatureCard
              icon={<MdFolderOpen />}
              color="pink"
              title="Git-Friendly Workspaces"
              description="Yasumu workspaces are git-friendly. Commit and share your workspaces with your team easily."
            />
            <FeatureCard
              icon={<MdPublic />}
              color="teal"
              title="Open Source"
              description="100% free and open source. Contribute on GitHub and help shape the future of API testing."
            />
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="relative overflow-hidden bg-black py-24">
        <BackgroundGrid />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="items-center lg:grid lg:grid-cols-2 lg:gap-16">
            <div className="mb-12 lg:mb-0">
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-white md:text-4xl">Proudly Open Source</h2>
              <p className="text-text-secondary mb-8 text-lg leading-relaxed">
                Yasumu is built on the shoulders of giants. We leverage the power of modern web technologies to deliver
                a native-like experience.
              </p>
              <div className="mb-8 flex flex-wrap gap-3 font-mono text-xs text-gray-400">
                {[
                  {
                    name: 'Rust',
                    url: 'https://www.rust-lang.org/',
                    icon: <SiRust className="size-4 text-orange-400" />,
                  },
                  {
                    name: 'Tauri',
                    url: 'https://tauri.app/',
                    icon: <SiTauri className="size-4 text-yellow-400" />,
                  },
                  {
                    name: 'TypeScript',
                    url: 'https://www.typescriptlang.org/',
                    icon: <SiTypescript className="size-4 text-blue-400" />,
                  },
                  {
                    name: 'Deno',
                    url: 'https://deno.com/',
                    icon: <SiDeno className="size-4 text-gray-300" />,
                  },
                ].map((tech) => (
                  <a
                    key={tech.name}
                    href={tech.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex cursor-pointer items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 transition-colors hover:border-white/30"
                  >
                    {tech.icon}
                    {tech.name}
                  </a>
                ))}
              </div>
              <div>
                <a
                  href="https://github.com/neplextech/yasumu"
                  className="inline-flex items-center gap-2 border-b border-white pb-0.5 font-medium text-white transition-colors hover:border-gray-300 hover:text-gray-300"
                >
                  Join the community on GitHub
                  <FaArrowRight className="ml-2 text-sm" />
                </a>
              </div>
            </div>

            {/* Terminal Mock */}
            <div className="relative overflow-hidden rounded-lg border border-gray-800 bg-[#0d1117] p-6 font-mono text-sm leading-relaxed shadow-2xl">
              <div className="mb-4 flex gap-2">
                <div className="h-3 w-3 rounded-full bg-[#FF5F56]"></div>
                <div className="h-3 w-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="h-3 w-3 rounded-full bg-[#27C93F]"></div>
              </div>
              <div className="text-gray-400 select-none"># Validate the complete YSL workspace</div>
              <div className="text-white">$ yasumu validate</div>
              <div className="mb-2 text-green-400">✓ Workspace is valid</div>
              <div className="mt-4 text-gray-400 select-none"># Run the same tests in headless mode</div>
              <div className="text-white">$ yasumu test --environment CI</div>
              <div className="text-gray-400">GET Current user · 200 · 84 ms</div>
              <div className="text-green-400">2 passed, 0 failed, 0 skipped</div>
              <div className="flex items-center text-white">
                REST and GraphQL execution complete
                <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-gray-400"></span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, color, title, description }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  };

  return (
    <div className="group cursor-default rounded-xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
      <div
        className={`mb-6 flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-transform duration-300 group-hover:scale-110 ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <h3 className="mb-3 text-lg font-semibold text-white">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
    </div>
  );
};
