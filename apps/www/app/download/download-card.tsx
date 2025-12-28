'use client';

import { MdDownload } from 'react-icons/md';

interface DownloadOption {
  label: string;
  note?: string;
  code?: string;
  url?: string;
}

export const DownloadCard: React.FC<{
  os: string;
  icon: React.ReactNode;
  description: string;
  options: DownloadOption[];
}> = ({ os, icon, description, options }) => {
  const handleDownload = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="bg-surface-dark border border-white/10 rounded-xl p-8 flex flex-col hover:border-white/20 transition-all duration-300 relative group overflow-hidden">
      <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white mb-6 border border-white/10 text-3xl">
        {icon}
      </div>

      <h3 className="text-2xl font-bold text-white mb-2">{os}</h3>
      <p className="text-sm text-text-secondary mb-8 h-10">{description}</p>

      <div className="flex flex-col gap-3 mt-auto relative z-10">
        {options.map((opt, i) => (
          <div
            key={i}
            onClick={() => handleDownload(opt.url)}
            className="bg-black/40 border border-white/5 rounded-lg p-3 hover:bg-white/5 transition-colors cursor-pointer group/btn"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-200 text-sm group-hover/btn:text-white">
                {opt.label}
              </span>
              <MdDownload className="text-gray-500 text-sm group-hover/btn:text-white" />
            </div>
            {opt.note && (
              <div className="text-[10px] text-gray-500 mt-1">{opt.note}</div>
            )}
            {opt.code && (
              <div className="text-[10px] text-gray-500 mt-1 font-mono bg-black/50 p-1 rounded border border-white/5">
                {opt.code}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
