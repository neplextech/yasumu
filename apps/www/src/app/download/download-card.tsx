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
    <div className="bg-surface-dark border border-white/10 rounded-xl p-6 flex flex-col hover:border-white/20 transition-all duration-300 relative group overflow-hidden">
      <div className="absolute top-0 right-0 p-24 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white border border-white/10 text-2xl shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{os}</h3>
          <p className="text-xs text-text-secondary">{description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 relative z-10">
        {visibleOptions.map((opt, i) => (
          <div
            key={i}
            onClick={(e) => handleDownload(opt.url, e)}
            className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer group/btn"
          >
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-200 text-sm group-hover/btn:text-white truncate">
                    {opt.label}
                  </span>
                  {opt.size && (
                    <span className="text-[10px] text-gray-500 shrink-0">
                      {formatBytes(opt.size)}
                    </span>
                  )}
                </div>
                {opt.note && (
                  <span className="text-[10px] text-gray-500 block truncate">
                    {opt.note}
                  </span>
                )}
              </div>
              <MdDownload className="text-gray-500 text-base group-hover/btn:text-white shrink-0" />
            </div>
          </div>
        ))}

        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="cursor-pointer flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white py-2 transition-colors"
          >
            <span>
              {expanded
                ? 'Show less'
                : `+${options.length - visibleCount} more`}
            </span>
            <MdExpandMore
              className={`text-base transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>
    </div>
  );
};
