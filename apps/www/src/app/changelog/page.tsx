'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BackgroundGrid } from '../../components/background-grid';
import { MdAddCircle, MdBuild, MdLabel, MdExpandMore } from 'react-icons/md';
import clsx from 'clsx';

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
  page: number;
  hasMore: boolean;
}

const GITHUB_API_URL =
  'https://api.github.com/repos/neplextech/yasumu/releases';
const CACHE_KEY = 'yasumu_changelog_releases_v2';
const CACHE_DURATION = 1000 * 60 * 15;
const PER_PAGE = 10;
const INITIAL_EXPANDED_COUNT = 3;

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

function useChangelogReleases() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchReleases = useCallback(
    async (pageNum: number, append = false) => {
      let cachedData: CachedData | null = null;

      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        if (!append) {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            cachedData = (() => {
              try {
                return JSON.parse(cached);
              } catch {
                return null;
              }
            })();

            // If cache is still valid, use it and return early
            if (
              cachedData &&
              Date.now() - cachedData.timestamp < CACHE_DURATION
            ) {
              setReleases(cachedData.releases);
              setPage(cachedData.page);
              setHasMore(cachedData.hasMore);
              setLoading(false);
              return;
            }
          }
        }

        const response = await fetch(
          `${GITHUB_API_URL}?per_page=${PER_PAGE}&page=${pageNum}`,
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
            },
          },
        );

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
        const newHasMore = releaseData.length === PER_PAGE;

        const updatedReleases = append
          ? [...releases, ...releaseData]
          : releaseData;

        const newCacheData: CachedData = {
          releases: updatedReleases,
          timestamp: Date.now(),
          page: pageNum,
          hasMore: newHasMore,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(newCacheData));

        setReleases(updatedReleases);
        setPage(pageNum);
        setHasMore(newHasMore);
      } catch (err) {
        // If fetch fails but we have expired cache (and not appending), use it as fallback
        if (cachedData && !append) {
          setReleases(cachedData.releases);
          setPage(cachedData.page);
          setHasMore(cachedData.hasMore);
        } else {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch releases',
          );
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [releases],
  );

  useEffect(() => {
    fetchReleases(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchReleases(page + 1, true);
    }
  }, [fetchReleases, loadingMore, hasMore, page]);

  return { releases, loading, loadingMore, error, hasMore, loadMore };
}

interface ReleaseItemProps {
  release: Release;
  index: number;
  isLatest: boolean;
  defaultExpanded: boolean;
}

function ReleaseItem({
  release,
  index,
  isLatest,
  defaultExpanded,
}: ReleaseItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={clsx('relative pl-8 md:pl-12', index !== 0 && 'opacity-90')}
    >
      <span
        className={clsx(
          'absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full ring-4 ring-background-dark',
          isLatest ? 'bg-blue-500' : 'bg-white/20',
        )}
      />
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <a
          href={release.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          <h2
            className={clsx(
              'text-2xl font-bold',
              isLatest ? 'text-white' : 'text-gray-300',
            )}
          >
            {release.tag_name}
          </h2>
        </a>
        {isLatest && !release.prerelease && (
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

      {!defaultExpanded && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            'flex items-center gap-1.5 text-sm mb-4 transition-colors cursor-pointer',
            expanded
              ? 'text-gray-400 hover:text-gray-300'
              : 'text-blue-400 hover:text-blue-300',
          )}
        >
          <MdExpandMore
            className={clsx(
              'text-lg transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
          {expanded ? 'Collapse' : 'Show details'}
        </button>
      )}

      <div
        ref={contentRef}
        className={clsx(
          'overflow-hidden transition-all duration-300',
          !expanded && !defaultExpanded && 'max-h-0',
        )}
      >
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
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 shrink-0" />
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
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="relative pl-8 md:pl-12 animate-pulse">
      <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-white/10 ring-4 ring-background-dark" />
      <div className="flex items-center gap-4 mb-6">
        <div className="h-7 w-24 bg-white/10 rounded" />
        <div className="h-5 w-32 bg-white/5 rounded" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-3/4 bg-white/5 rounded" />
        <div className="h-4 w-1/2 bg-white/5 rounded" />
        <div className="h-4 w-2/3 bg-white/5 rounded" />
      </div>
    </div>
  );
}

export default function Changelog() {
  const { releases, loading, loadingMore, error, hasMore, loadMore } =
    useChangelogReleases();

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
          {loading && (
            <>
              <LoadingSkeleton />
              <LoadingSkeleton />
              <LoadingSkeleton />
            </>
          )}

          {error && (
            <div className="pl-8 md:pl-12 text-red-400">
              Failed to load updates. Please check back later.
            </div>
          )}

          {!loading && !error && releases.length === 0 && (
            <div className="pl-8 md:pl-12 text-gray-400">
              No releases found.
            </div>
          )}

          {releases.map((release, index) => (
            <ReleaseItem
              key={release.id}
              release={release}
              index={index}
              isLatest={index === 0}
              defaultExpanded={index < INITIAL_EXPANDED_COUNT}
            />
          ))}

          {loadingMore && <LoadingSkeleton />}

          {releases.length > 0 && hasMore && !loadingMore && (
            <div className="relative pl-8 md:pl-12">
              <span className="absolute -left-[5px] top-3 h-2.5 w-2.5 rounded-full bg-white/10 ring-4 ring-background-dark" />
              <button
                onClick={loadMore}
                className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200 text-sm font-medium cursor-pointer"
              >
                Load older releases
              </button>
            </div>
          )}

          {releases.length > 0 && !hasMore && (
            <div className="relative pl-8 md:pl-12">
              <span className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-white/10 ring-4 ring-background-dark" />
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
