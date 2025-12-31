'use client';

import { BackgroundGrid } from '../../components/background-grid';
import { FaApple, FaBoxArchive, FaTerminal, FaWindows } from 'react-icons/fa6';
import { VscTerminalLinux } from 'react-icons/vsc';
import { DownloadCard } from './download-card';
import { useGitHubReleases } from './use-github-releases';
import { BsGithub } from 'react-icons/bs';
import { Button } from '@yasumu/ui/components/button';

function DownloadSkeleton() {
  return (
    <div className="bg-surface-dark border border-white/10 rounded-xl p-8 flex flex-col animate-pulse">
      <div className="w-16 h-16 bg-white/5 rounded-2xl mb-6" />
      <div className="h-8 w-32 bg-white/5 rounded mb-2" />
      <div className="h-4 w-48 bg-white/5 rounded mb-8" />
      <div className="flex flex-col gap-3 mt-auto">
        <div className="h-16 bg-white/5 rounded-lg" />
        <div className="h-16 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-8 bg-surface-dark border border-white/10 rounded-xl">
      <div className="text-6xl mb-6 opacity-50">
        <FaBoxArchive />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        No downloadable content found
      </h3>
      <p className="text-text-secondary text-center max-w-md mb-6">
        We couldn&apos;t fetch the latest releases from GitHub. This might be
        due to rate limiting or network issues.
      </p>
      <div className="flex gap-8">
        <Button
          asChild
          variant="outline"
          className="h-12 px-8 text-base font-medium rounded-lg text-gray-300 border-white/20 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/30 backdrop-blur-sm"
        >
          <a
            href="https://github.com/neplextech/yasumu/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
          >
            <BsGithub className="size-4" />
            Check Latest Release
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-12 px-8 text-base font-medium rounded-lg text-gray-300 border-white/20 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/30 backdrop-blur-sm"
        >
          <a
            href="https://github.com/neplextech/yasumu"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaTerminal className="size-4 mr-2" />
            Build from source
          </a>
        </Button>
      </div>
    </div>
  );
}

export default function Download() {
  const { assets, loading, error } = useGitHubReleases();

  const hasAnyAssets =
    assets &&
    (assets.macOS.length > 0 ||
      assets.windows.length > 0 ||
      assets.linux.length > 0);

  return (
    <div className="animate-fade-in pt-32 pb-20">
      <BackgroundGrid />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm cursor-default">
            <span className="text-xs font-mono font-medium text-gray-400">
              Public Beta
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
            Get Yasumu
          </h1>
          <p className="text-lg text-text-secondary">
            Available for macOS, Windows, and Linux.{' '}
            <br className="hidden md:block" />
            Completely free and open source.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {loading ? (
            <>
              <DownloadSkeleton />
              <DownloadSkeleton />
              <DownloadSkeleton />
            </>
          ) : error || !hasAnyAssets ? (
            <ErrorState />
          ) : (
            <>
              <DownloadCard
                os="macOS"
                icon={<FaApple />}
                description="Requires macOS 11.0 or later."
                options={assets.macOS.map((asset) => ({
                  label: asset.label,
                  note: asset.note,
                  url: asset.browser_download_url,
                }))}
              />

              <DownloadCard
                os="Windows"
                icon={<FaWindows />}
                description="Requires Windows 10 or later."
                options={assets.windows.map((asset) => ({
                  label: asset.label,
                  note: asset.note,
                  url: asset.browser_download_url,
                }))}
              />

              <DownloadCard
                os="Linux"
                icon={<VscTerminalLinux />}
                description="Works on most major distributions."
                options={assets.linux.map((asset) => ({
                  label: asset.label,
                  note: asset.note,
                  url: asset.browser_download_url,
                }))}
              />
            </>
          )}
        </div>

        <div className="mt-20 max-w-4xl mx-auto bg-black/30 border border-white/5 rounded-xl p-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Latest Release{assets?.tagName && ` — ${assets.tagName}`}
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            Downloads are always from the latest stable release. You can also
            view{' '}
            <a
              href="https://github.com/neplextech/yasumu/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              all releases on GitHub
            </a>{' '}
            to access previous versions or checksums.
          </p>
          <div className="bg-black border border-white/10 rounded-lg p-4 font-mono text-xs text-gray-400 overflow-x-auto">
            <div className="mb-2">
              <span className="text-green-400">✓</span>{' '}
              <span className="text-blue-400">Latest stable release</span>
            </div>
            <div className="mb-2">
              <span className="text-green-400">✓</span>{' '}
              <span className="text-blue-400">Automatic updates included</span>
            </div>
            <div>
              <span className="text-green-400">✓</span>{' '}
              <span className="text-blue-400">Digitally signed binaries</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
