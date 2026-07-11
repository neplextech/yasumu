'use client';

import { Button } from '@yasumu/ui/components/button';
import clsx from 'clsx';
import { useState } from 'react';
import { BsGithub } from 'react-icons/bs';
import { FaApple, FaBoxArchive, FaTerminal, FaWindows } from 'react-icons/fa6';
import { VscTerminalLinux } from 'react-icons/vsc';

import { BackgroundGrid } from '../../components/background-grid';
import { DownloadCard } from './download-card';
import { useGitHubReleases, type ReleaseChannel, type DownloadAssets } from './use-github-releases';

function DownloadSkeleton() {
  return (
    <div className="bg-surface-dark flex animate-pulse flex-col rounded-xl border border-white/10 p-6">
      <div className="mb-4 flex items-center gap-4">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-white/5" />
        <div className="flex-1">
          <div className="mb-1.5 h-5 w-20 rounded bg-white/5" />
          <div className="h-3 w-32 rounded bg-white/5" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-14 rounded-lg bg-white/5" />
        <div className="h-14 rounded-lg bg-white/5" />
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="bg-surface-dark col-span-full flex flex-col items-center justify-center rounded-xl border border-white/10 px-8 py-16">
      <div className="mb-6 text-6xl opacity-50">
        <FaBoxArchive />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">No downloadable content found</h3>
      <p className="text-text-secondary mb-6 max-w-md text-center">
        We couldn&apos;t fetch the latest releases from GitHub. This might be due to rate limiting or network issues.
      </p>
      <div className="flex gap-8">
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-lg border-white/20 bg-white/5 px-8 text-base font-medium text-gray-300 backdrop-blur-sm hover:border-white/30 hover:bg-white/10 hover:text-white"
        >
          <a href="https://github.com/neplextech/yasumu/releases/latest" target="_blank" rel="noopener noreferrer">
            <BsGithub className="size-4" />
            Check Latest Release
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-lg border-white/20 bg-white/5 px-8 text-base font-medium text-gray-300 backdrop-blur-sm hover:border-white/30 hover:bg-white/10 hover:text-white"
        >
          <a href="https://github.com/neplextech/yasumu" target="_blank" rel="noopener noreferrer">
            <FaTerminal className="mr-2 size-4" />
            Build from source
          </a>
        </Button>
      </div>
    </div>
  );
}

interface ChannelTabProps {
  channel: ReleaseChannel;
  activeChannel: ReleaseChannel;
  onClick: () => void;
  tagName?: string;
  disabled?: boolean;
}

function ChannelTab({ channel, activeChannel, onClick, tagName, disabled }: ChannelTabProps) {
  const isActive = channel === activeChannel;
  const isStable = channel === 'stable';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'relative px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer',
        'flex items-center gap-2',
        isActive
          ? 'bg-white/10 text-white border border-white/20'
          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span className="capitalize">{channel}</span>
      {tagName && isStable && (
        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
          {tagName}
        </span>
      )}
    </button>
  );
}

interface DownloadSectionProps {
  assets: DownloadAssets;
}

function DownloadSection({ assets }: DownloadSectionProps) {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <DownloadCard
        os="macOS"
        icon={<FaApple />}
        description="Requires macOS 11.0 or later."
        options={assets.macOS.map((asset) => ({
          label: asset.label,
          note: asset.note,
          size: asset.size,
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
          size: asset.size,
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
          size: asset.size,
          url: asset.browser_download_url,
        }))}
      />
    </div>
  );
}

interface ChecksumSectionProps {
  assets: DownloadAssets;
}

function ChecksumSection({ assets }: ChecksumSectionProps) {
  const allAssets = [...assets.macOS, ...assets.windows, ...assets.linux];

  if (allAssets.length === 0) return null;

  return (
    <div className="mx-auto mt-20 max-w-4xl rounded-xl border border-white/5 bg-black/30 p-8">
      <h3 className="mb-4 text-lg font-semibold text-white">
        SHA256 Checksums{assets.tagName && ` — ${assets.tagName}`}
      </h3>
      <p className="text-text-secondary mb-6 text-sm">
        Verify your download by comparing the checksum below. You can also view{' '}
        <a
          href="https://github.com/neplextech/yasumu/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline hover:text-blue-300"
        >
          all releases on GitHub
        </a>{' '}
        for previous versions.
      </p>
      <div className="space-y-1.5 overflow-x-auto rounded-lg border border-white/10 bg-black p-4 font-mono text-xs text-gray-400">
        {allAssets.map((asset) => (
          <div key={asset.name} className="flex gap-2">
            <span className="shrink-0 text-gray-500">{asset.sha256}</span>
            <a href={asset.browser_download_url} className="text-gray-300 transition-colors hover:text-blue-400">
              {asset.name}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function MacOsUnsignedBypassCommand({ channel }: { channel: ReleaseChannel }) {
  const [copied, setCopied] = useState(false);

  const app = channel === 'canary' ? 'Yasumu\\ Canary.app' : 'Yasumu.app';
  const command = `xattr -rd com.apple.quarantine /Applications/${app}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = command;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-3xl">
      <div className="rounded-xl border border-amber-500/20 bg-linear-to-br from-amber-950/30 to-orange-950/20 p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
            <FaApple className="text-lg text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="mb-2 text-sm font-semibold text-amber-300">macOS Gatekeeper Bypass</h4>
            <p className="mb-4 text-sm leading-relaxed text-amber-200/70">
              Yasumu is not yet signed with an Apple Developer certificate. When opening the app for the first time,
              macOS will block it. Run this command in Terminal after installing:
            </p>
            <div className="group relative">
              <div className="overflow-hidden rounded-lg border border-white/10 bg-black/60">
                <div className="flex items-center justify-between border-b border-white/5 bg-white/2 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FaTerminal className="text-xs text-gray-500" />
                    <span className="text-[10px] font-medium tracking-wider text-gray-500 uppercase">Terminal</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className={clsx(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all duration-200',
                      copied
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    {copied ? (
                      <>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="scrollbar-thin scrollbar-thumb-white/10 overflow-x-auto px-4 py-3 font-mono text-sm text-gray-300">
                  <code>{command}</code>
                </pre>
              </div>
            </div>
            <p className="mt-3 text-xs text-amber-200/50">
              This removes the quarantine attribute, allowing the app to launch normally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Download() {
  const { releases, loading, error } = useGitHubReleases();
  const [activeChannel, setActiveChannel] = useState<ReleaseChannel>('stable');

  const hasStable = releases.stable !== null;
  const hasCanary = releases.canary !== null;
  const hasAnyReleases = hasStable || hasCanary;

  const effectiveChannel: ReleaseChannel =
    activeChannel === 'stable' && !hasStable && hasCanary
      ? 'canary'
      : activeChannel === 'canary' && !hasCanary && hasStable
        ? 'stable'
        : activeChannel;

  const currentAssets = releases[effectiveChannel];

  const hasCurrentAssets =
    currentAssets &&
    (currentAssets.macOS.length > 0 || currentAssets.windows.length > 0 || currentAssets.linux.length > 0);

  return (
    <div className="animate-fade-in pt-32 pb-20">
      <BackgroundGrid />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div
            className={clsx(
              'inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-8 backdrop-blur-sm cursor-default',
              effectiveChannel === 'canary' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/10',
            )}
          >
            <span
              className={clsx(
                'text-xs font-mono font-medium',
                effectiveChannel === 'canary' ? 'text-amber-400' : 'text-gray-400',
              )}
            >
              {effectiveChannel === 'canary' && releases.canary?.tagName ? releases.canary.tagName : 'Public Beta'}
            </span>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl">Get Yasumu</h1>
          <p className="text-text-secondary text-lg">
            Available for macOS, Windows, and Linux. <br className="hidden md:block" />
            Completely free and open source.
          </p>
        </div>

        {!loading && hasAnyReleases && (
          <div className="mb-12 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-sm">
              <ChannelTab
                channel="stable"
                activeChannel={effectiveChannel}
                onClick={() => setActiveChannel('stable')}
                tagName={releases.stable?.tagName}
                disabled={!hasStable}
              />
              <ChannelTab
                channel="canary"
                activeChannel={effectiveChannel}
                onClick={() => setActiveChannel('canary')}
                tagName={releases.canary?.tagName}
                disabled={!hasCanary}
              />
            </div>
          </div>
        )}

        {effectiveChannel === 'canary' && hasCanary && (
          <div className="mx-auto mb-8 max-w-3xl">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
              <strong className="font-semibold text-amber-400">Canary builds</strong> are experimental and may contain
              bugs or incomplete features. These builds are updated frequently and are intended for testing new
              functionality.
            </div>
          </div>
        )}

        {loading ? (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DownloadSkeleton />
            <DownloadSkeleton />
            <DownloadSkeleton />
          </div>
        ) : error || !hasCurrentAssets ? (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6">
            <ErrorState />
          </div>
        ) : (
          <>
            <DownloadSection assets={currentAssets} />
            {currentAssets.macOS.length > 0 && <MacOsUnsignedBypassCommand channel={effectiveChannel} />}
            <ChecksumSection assets={currentAssets} />
          </>
        )}
      </div>
    </div>
  );
}
