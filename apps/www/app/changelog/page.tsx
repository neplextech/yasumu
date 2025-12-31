'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BackgroundGrid } from '../../components/background-grid';
import { MdAddCircle, MdBuild, MdLabel } from 'react-icons/md';

interface Release {
  id: number;
  tag_name: string;
  published_at: string;
  body: string;
  prerelease: boolean;
  html_url: string;
}

interface CachedData {
  releases: Release[];
  timestamp: number;
}

const GITHUB_API_URL =
  'https://api.github.com/repos/neplextech/yasumu/releases';
const CACHE_KEY = 'yasumu_changelog_releases';
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

function useChangelogReleases() {
  const [releases, setReleases] = useState<Release[] | null>(null);
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
            setReleases(parsed.releases);
            setLoading(false);
            return;
          }
        }

        const response = await fetch(GITHUB_API_URL, {
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

        const data = await response.json();
        const releaseData: Release[] = Array.isArray(data) ? data : [];

        const cacheData: CachedData = {
          releases: releaseData,
          timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

        setReleases(releaseData);
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

export default function Changelog() {
  const { releases, loading: isLoading, error } = useChangelogReleases();

  return (
    <div className="animate-fade-in pt-32 pb-20">
      <BackgroundGrid />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
            Changelog
          </h1>
          <p className="text-lg text-text-secondary">
            Stay up to date with the latest features and improvements.
          </p>
        </div>

        <div className="relative border-l border-white/10 ml-4 md:ml-6 space-y-16">
          {isLoading && (
            <div className="pl-8 md:pl-12 text-gray-400">
              Loading updates...
            </div>
          )}

          {error && (
            <div className="pl-8 md:pl-12 text-red-400">
              Failed to load updates. Please check back later.
            </div>
          )}

          {!releases?.length && (
            <div className="pl-8 md:pl-12 text-gray-400">
              No releases found.
            </div>
          )}

          {releases?.map((release, index) => (
            <div
              key={release.id}
              className={`relative pl-8 md:pl-12 ${
                index !== 0 ? 'opacity-90' : ''
              }`}
            >
              <span
                className={`absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full ring-4 ring-background-dark ${
                  index === 0 ? 'bg-blue-500' : 'bg-white/20'
                }`}
              ></span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <a
                  href={release.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  <h2
                    className={`text-2xl font-bold ${
                      index === 0 ? 'text-white' : 'text-gray-300'
                    }`}
                  >
                    {release.tag_name}
                  </h2>
                </a>
                {index === 0 && !release.prerelease && (
                  <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
                    Latest Release
                  </span>
                )}
                {release.prerelease && (
                  <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 w-fit">
                    Pre-release
                  </span>
                )}
                <span className="text-sm text-text-secondary font-mono">
                  {formatDate(release.published_at)}
                </span>
              </div>

              <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h3 className="text-white font-semibold mt-6 mb-3 text-xl">
                        {children}
                      </h3>
                    ),
                    h2: ({ children }) => (
                      <h3 className="text-white font-semibold mt-6 mb-3 text-lg">
                        {children}
                      </h3>
                    ),
                    h3: ({ children }) => {
                      // Attempt to detect content for icons (simple heuristic)
                      const text = String(children).toLowerCase();
                      let Icon = MdLabel;
                      let iconColor = 'text-gray-400';

                      if (text.includes('feature')) {
                        Icon = MdAddCircle;
                        iconColor = 'text-green-400';
                      } else if (
                        text.includes('improvement') ||
                        text.includes('fix')
                      ) {
                        Icon = MdBuild;
                        iconColor = 'text-purple-400';
                      }

                      return (
                        <h3 className="text-white font-semibold mt-6 mb-3 flex items-center gap-2">
                          <Icon className={`${iconColor} text-sm`} /> {children}
                        </h3>
                      );
                    },
                    ul: ({ children }) => (
                      <ul className="space-y-2 list-none pl-0">{children}</ul>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 shrink-0"></span>
                        <span>{children}</span>
                      </li>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {release.body}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {/* Initial Commit / History Start */}
          {releases && releases.length > 0 && (
            <div className="relative pl-8 md:pl-12">
              <span className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-white/10 ring-4 ring-background-dark"></span>
              <div className="text-sm text-gray-600 font-mono pt-1">
                Project started
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
