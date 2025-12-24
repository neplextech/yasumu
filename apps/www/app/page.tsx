import React from 'react';
import Link from 'next/link';
import AppPreview from '../components/app-preview';
import { BackgroundGrid } from '../components/background-grid';
import { Button } from '@yasumu/ui/components/button';
import {
  MdCode,
  MdBolt,
  MdGridView,
  MdLock,
  MdFolderOpen,
  MdPublic,
} from 'react-icons/md';
import { FaArrowRight, FaDownload, FaGithub } from 'react-icons/fa6';

export default function Home() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <BackgroundGrid />
        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="/changelog"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm hover:border-white/20 transition-colors cursor-pointer group"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-mono font-medium text-gray-300 group-hover:text-white transition-colors">
              Now in public beta
            </span>
          </Link>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            The Modern API Laboratory
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-xl text-text-secondary leading-relaxed">
            Design, test, and debug your API workflows with a fast, open-source
            tool built for the modern web. Experience a beautiful, monochromatic
            interface that gets out of your way.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="h-12 px-8 text-base font-medium rounded-lg text-black bg-white hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]"
            >
              <Link href="/download">
                <FaDownload className="mr-2 text-xl" />
                Download for Free
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 px-8 text-base font-medium rounded-lg text-gray-300 border-white/20 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/30 backdrop-blur-sm"
            >
              <a href="https://github.com/neplextech/yasumu">
                <FaGithub className="mr-2 text-xl" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-24 relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[80%] h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-40"></div>
          <AppPreview />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-surface-dark border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm text-blue-400 font-mono font-semibold tracking-widest uppercase mb-3">
              Core Features
            </h2>
            <p className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">
              Everything you need for API development
            </p>
            <p className="text-lg text-text-secondary leading-relaxed">
              Built with performance and user experience in mind. Yasumu removes
              the clutter so you can focus on the data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<MdBolt />}
              color="blue"
              title="Lightweight & Fast"
              description="Built with Tauri and Deno runtime for lightweight and better performance compared to traditional Electron-based alternatives."
            />
            <FeatureCard
              icon={<MdGridView />}
              color="purple"
              title="Clean Interface"
              description="A distraction-free, monochromatic environment inspired by modern design principles."
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
              title="Code Generation"
              description="Instantly generate client code for Fetch, Axios, cURL, etc. from your requests."
            />
            <FeatureCard
              icon={<MdFolderOpen />}
              color="pink"
              title="Organized Workspaces"
              description="Group your requests into folders and workspaces. Share workspaces with configuration files."
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
      <section className="py-24 relative overflow-hidden bg-black">
        <BackgroundGrid />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="mb-12 lg:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
                Proudly Open Source
              </h2>
              <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                Yasumu is built on the shoulders of giants. We leverage the
                power of modern web technologies to deliver a native-like
                experience.
              </p>
              <div className="flex flex-wrap gap-3 text-xs font-mono text-gray-400 mb-8">
                {['Rust', 'Tauri', 'TypeScript', 'Tailwind'].map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 bg-white/5 rounded border border-white/10 hover:border-white/30 transition-colors cursor-default"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div>
                <a
                  href="https://github.com/neplextech/yasumu"
                  className="text-white hover:text-gray-300 font-medium inline-flex items-center gap-2 transition-colors border-b border-white pb-0.5 hover:border-gray-300"
                >
                  Join the community on GitHub
                  <FaArrowRight className="ml-2 text-sm" />
                </a>
              </div>
            </div>

            {/* Terminal Mock */}
            <div className="relative rounded-lg bg-[#0d1117] border border-gray-800 shadow-2xl p-6 font-mono text-sm leading-relaxed overflow-hidden">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
              </div>
              <div className="text-gray-400 select-none">
                # Clone the repository
              </div>
              <div className="text-white">
                $ git clone{' '}
                <span className="text-blue-400">
                  https://github.com/neplextech/yasumu
                </span>
              </div>
              <div className="text-gray-500 mb-2">Cloning into 'yasumu'...</div>
              <div className="text-gray-400 select-none mt-4">
                # Run the development server
              </div>
              <div className="text-white">
                $ pnpm i && pnpm build && pnpm app
              </div>
              <div className="text-gray-500">
                {' '}
                Compiling yasumu v1.0.0 (/path/to/yasumu)
              </div>
              <div className="text-green-400">
                {' '}
                Finished dev [unoptimized + debuginfo] target(s) in 2.34s
              </div>
              <div className="text-white flex items-center">
                {' '}
                Running `target/debug/yasumu`
                <span className="animate-pulse ml-1 w-2 h-4 bg-gray-400 inline-block"></span>
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

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  color,
  title,
  description,
}) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 p-8 rounded-xl hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 group cursor-default">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border text-xl ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
};
