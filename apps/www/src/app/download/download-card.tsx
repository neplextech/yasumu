'use client';

import { useState } from 'react';
import { MdDownload, MdExpandMore } from 'react-icons/md';

interface DownloadOption {
  label: string;
  note?: string;
  size?: number;
  url?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const DownloadCard: React.FC<{
  os: string;
  icon: React.ReactNode;
  description: string;
  options: DownloadOption[];
}> = ({ os, icon, description, options }) => {
  const [expanded, setExpanded] = useState(false);
  const visibleCount = 2;
  const hasMore = options.length > visibleCount;
  const visibleOptions = expanded ? options : options.slice(0, visibleCount);

  const handleDownload = (url?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="bg-surface-dark group relative flex flex-col overflow-hidden rounded-xl border border-white/10 p-6 transition-all duration-300 hover:border-white/20">
      <div className="pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 rounded-full bg-white/5 p-24 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl text-white">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{os}</h3>
          <p className="text-text-secondary text-xs">{description}</p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-2">
        {visibleOptions.map((opt, i) => (
          <div
            key={i}
            onClick={(e) => handleDownload(opt.url, e)}
            className="group/btn cursor-pointer rounded-lg border border-white/5 bg-black/40 px-3 py-2.5 transition-colors hover:bg-white/5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-gray-200 group-hover/btn:text-white">
                    {opt.label}
                  </span>
                  {opt.size && <span className="shrink-0 text-[10px] text-gray-500">{formatBytes(opt.size)}</span>}
                </div>
                {opt.note && <span className="block truncate text-[10px] text-gray-500">{opt.note}</span>}
              </div>
              <MdDownload className="shrink-0 text-base text-gray-500 group-hover/btn:text-white" />
            </div>
          </div>
        ))}

        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex cursor-pointer items-center justify-center gap-1 py-2 text-xs text-gray-400 transition-colors hover:text-white"
          >
            <span>{expanded ? 'Show less' : `+${options.length - visibleCount} more`}</span>
            <MdExpandMore className={`text-base transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};
