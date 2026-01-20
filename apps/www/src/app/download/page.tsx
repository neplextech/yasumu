'use client';

import { useState } from 'react';
import { BackgroundGrid } from '../../components/background-grid';
import { FaApple, FaBoxArchive, FaTerminal, FaWindows } from 'react-icons/fa6';
import { VscTerminalLinux } from 'react-icons/vsc';
import { DownloadCard } from './download-card';
import {
  useGitHubReleases,
  type ReleaseChannel,
  type DownloadAssets,
} from './use-github-releases';
import { BsGithub } from 'react-icons/bs';
import { Button } from '@yasumu/ui/components/button';
import clsx from 'clsx';

function DownloadSkeleton() {
  return (
    <div className="bg-surface-dark border border-white/10 rounded-xl p-6 flex flex-col animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-white/5 rounded-xl shrink-0" />
        <div className="flex-1">
          <div className="h-5 w-20 bg-white/5 rounded mb-1.5" />
          <div className="h-3 w-32 bg-white/5 rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-14 bg-white/5 rounded-lg" />
        <div className="h-14 bg-white/5 rounded-lg" />
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

interface ChannelTabProps {
  channel: ReleaseChannel;
  activeChannel: ReleaseChannel;
  onClick: () => void;
  tagName?: string;
  disabled?: boolean;
}

function ChannelTab({
  channel,
  activeChannel,
  onClick,
  tagName,
  disabled,
}: ChannelTabProps) {
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
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-400">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
    <div className="mt-20 max-w-4xl mx-auto bg-black/30 border border-white/5 rounded-xl p-8">
      <h3 className="text-lg font-semibold text-white mb-4">
        SHA256 Checksums{assets.tagName && ` — ${assets.tagName}`}
      </h3>
      <p className="text-sm text-text-secondary mb-6">
        Verify your download by comparing the checksum below. You can also view{' '}
        <a
          href="https://github.com/neplextech/yasumu/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          all releases on GitHub
        </a>{' '}
        for previous versions.
      </p>
      <div className="bg-black border border-white/10 rounded-lg p-4 font-mono text-xs text-gray-400 overflow-x-auto space-y-1.5">
        {allAssets.map((asset) => (
          <div key={asset.name} className="flex gap-2">
            <span className="text-gray-500 shrink-0">{asset.sha256}</span>
            <a
              href={asset.browser_download_url}
              className="text-gray-300 hover:text-blue-400 transition-colors"
            >
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
    <div className="mt-12 max-w-3xl mx-auto">
      <div className="bg-linear-to-br from-amber-950/30 to-orange-950/20 border border-amber-500/20 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <FaApple className="text-amber-400 text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-amber-300 mb-2">
              macOS Gatekeeper Bypass
            </h4>
            <p className="text-sm text-amber-200/70 mb-4 leading-relaxed">
              Yasumu is not yet signed with an Apple Developer certificate. When
              opening the app for the first time, macOS will block it. Run this
              command in Terminal after installing:
            </p>
            <div className="relative group">
              <div className="bg-black/60 border border-white/10 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/2">
                  <div className="flex items-center gap-2">
                    <FaTerminal className="text-gray-500 text-xs" />
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                      Terminal
                    </span>
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
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
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
                <pre className="px-4 py-3 text-sm text-gray-300 font-mono overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
                  <code>{command}</code>
                </pre>
              </div>
            </div>
            <p className="text-xs text-amber-200/50 mt-3">
              This removes the quarantine attribute, allowing the app to launch
              normally.
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
    (currentAssets.macOS.length > 0 ||
      currentAssets.windows.length > 0 ||
      currentAssets.linux.length > 0);

  return (
    <div className="animate-fade-in pt-32 pb-20">
      <BackgroundGrid />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div
            className={clsx(
              'inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-8 backdrop-blur-sm cursor-default',
              effectiveChannel === 'canary'
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-white/5 border-white/10',
            )}
          >
            <span
              className={clsx(
                'text-xs font-mono font-medium',
                effectiveChannel === 'canary'
                  ? 'text-amber-400'
                  : 'text-gray-400',
              )}
            >
              {effectiveChannel === 'canary' && releases.canary?.tagName
                ? releases.canary.tagName
                : 'Public Beta'}
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

        {!loading && hasAnyReleases && (
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-2 p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-sm">
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
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-200/90">
              <strong className="font-semibold text-amber-400">
                Canary builds
              </strong>{' '}
              are experimental and may contain bugs or incomplete features.
              These builds are updated frequently and are intended for testing
              new functionality.
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <DownloadSkeleton />
            <DownloadSkeleton />
            <DownloadSkeleton />
          </div>
        ) : error || !hasCurrentAssets ? (
          <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
            <ErrorState />
          </div>
        ) : (
          <>
            <DownloadSection assets={currentAssets} />
            {currentAssets.macOS.length > 0 && (
              <MacOsUnsignedBypassCommand channel={effectiveChannel} />
            )}
            <ChecksumSection assets={currentAssets} />
          </>
        )}
      </div>
    </div>
  );
}
