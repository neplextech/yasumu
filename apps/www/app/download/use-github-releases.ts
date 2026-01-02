'use client';

import { useState, useEffect } from 'react';

const GITHUB_RELEASES_URL =
  'https://api.github.com/repos/neplextech/yasumu/releases';
const CACHE_KEY = 'yasumu_github_releases_v2';
const CACHE_DURATION = 1000 * 60 * 15;

interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
  digest: string;
}

interface GitHubRelease {
  tag_name: string;
  assets: GitHubAsset[];
  prerelease: boolean;
  draft: boolean;
}

interface CachedData {
  releases: GitHubRelease[];
  timestamp: number;
}

type Architecture = 'x64' | 'arm64' | 'x86' | 'universal' | 'unknown';

export interface DownloadAsset extends GitHubAsset {
  arch: Architecture;
  label: string;
  note: string;
  sha256: string;
}

export interface DownloadAssets {
  macOS: DownloadAsset[];
  windows: DownloadAsset[];
  linux: DownloadAsset[];
  tagName: string;
}

export type ReleaseChannel = 'stable' | 'canary';

export interface ChannelReleases {
  stable: DownloadAssets | null;
  canary: DownloadAssets | null;
}

const ARCH_PATTERNS: { pattern: RegExp; arch: Architecture }[] = [
  { pattern: /universal/i, arch: 'universal' },
  { pattern: /aarch64|arm64/i, arch: 'arm64' },
  { pattern: /x86_64|x64|amd64/i, arch: 'x64' },
  { pattern: /i[36]86|x86(?!_64)/i, arch: 'x86' },
];

function detectArchitecture(filename: string): Architecture {
  for (const { pattern, arch } of ARCH_PATTERNS) {
    if (pattern.test(filename)) {
      return arch;
    }
  }
  return 'unknown';
}

function getArchLabel(arch: Architecture): string {
  switch (arch) {
    case 'universal':
      return 'Intel & Apple Silicon';
    case 'arm64':
      return 'ARM64 (Apple Silicon, etc.)';
    case 'x64':
      return '64-bit (x86_64)';
    case 'x86':
      return '32-bit (x86)';
    default:
      return '';
  }
}

function isCanaryRelease(tagName: string): boolean {
  return tagName.toLowerCase().includes('canary');
}

function categorizeAssets(
  assets: GitHubAsset[],
): Omit<DownloadAssets, 'tagName'> {
  const result: Omit<DownloadAssets, 'tagName'> = {
    macOS: [],
    windows: [],
    linux: [],
  };

  const extractSha256 = (digest: string) => {
    if (digest?.startsWith('sha256:')) {
      return digest.slice(7);
    }
    return digest || '';
  };

  for (const asset of assets) {
    const name = asset.name.toLowerCase();
    const arch = detectArchitecture(asset.name);
    const archNote = getArchLabel(arch);
    const sha256 = extractSha256(asset.digest);

    if (name.endsWith('.dmg')) {
      result.macOS.push({
        ...asset,
        arch,
        sha256,
        label: `DMG Installer (.dmg)`,
        note: archNote || 'macOS',
      });
    } else if (name.endsWith('.exe') && !name.includes('nsis')) {
      result.windows.push({
        ...asset,
        arch,
        sha256,
        label: `Installer (.exe)`,
        note: archNote || '64-bit',
      });
    } else if (name.endsWith('.msi')) {
      result.windows.push({
        ...asset,
        arch,
        sha256,
        label: `MSI Installer (.msi)`,
        note: archNote || '64-bit',
      });
    } else if (name.endsWith('.deb')) {
      result.linux.push({
        ...asset,
        arch,
        sha256,
        label: `Debian (.deb)`,
        note: archNote
          ? `${archNote} — Ubuntu, Debian`
          : 'Ubuntu, Debian, etc.',
      });
    } else if (name.endsWith('.appimage')) {
      result.linux.push({
        ...asset,
        arch,
        sha256,
        label: `AppImage`,
        note: archNote ? `${archNote} — Universal` : 'Universal',
      });
    } else if (name.endsWith('.rpm')) {
      result.linux.push({
        ...asset,
        arch,
        sha256,
        label: `RPM (.rpm)`,
        note: archNote ? `${archNote} — Fedora, RHEL` : 'Fedora, RHEL, etc.',
      });
    }
  }

  const sortByArch = (a: DownloadAsset, b: DownloadAsset) => {
    const order: Architecture[] = [
      'universal',
      'x64',
      'arm64',
      'x86',
      'unknown',
    ];
    return order.indexOf(a.arch) - order.indexOf(b.arch);
  };

  result.macOS.sort(sortByArch);
  result.windows.sort(sortByArch);
  result.linux.sort(sortByArch);

  return result;
}

function processReleases(releases: GitHubRelease[]): ChannelReleases {
  const result: ChannelReleases = {
    stable: null,
    canary: null,
  };

  for (const release of releases) {
    if (release.draft) continue;

    const isCanary = isCanaryRelease(release.tag_name);
    const channel = isCanary ? 'canary' : 'stable';

    if (result[channel] === null) {
      const categorized = categorizeAssets(release.assets);
      const hasAssets =
        categorized.macOS.length > 0 ||
        categorized.windows.length > 0 ||
        categorized.linux.length > 0;

      if (hasAssets) {
        result[channel] = {
          ...categorized,
          tagName: release.tag_name,
        };
      }
    }

    if (result.stable && result.canary) break;
  }

  return result;
}

export function useGitHubReleases() {
  const [releases, setReleases] = useState<ChannelReleases>({
    stable: null,
    canary: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReleases() {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: CachedData = (() => {
            try {
              return JSON.parse(cached);
            } catch {
              return null;
            }
          })();
          if (parsed && Date.now() - parsed.timestamp < CACHE_DURATION) {
            setReleases(processReleases(parsed.releases));
            setLoading(false);
            return;
          }
        }

        const response = await fetch(`${GITHUB_RELEASES_URL}?per_page=20`, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error(
              'GitHub API rate limit exceeded. Please try again later.',
            );
          }
          throw new Error(`Failed to fetch releases: ${response.statusText}`);
        }

        const data: GitHubRelease[] = await response.json();

        const cacheData: CachedData = {
          releases: data,
          timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

        setReleases(processReleases(data));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch releases',
        );
      } finally {
        setLoading(false);
      }
    }

    fetchReleases();
  }, []);

  return { releases, loading, error };
}
