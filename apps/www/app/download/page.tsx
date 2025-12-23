import React from 'react';
import { BackgroundGrid } from '../../components/BackgroundGrid';
import { MdDownload } from 'react-icons/md';
import { FaApple, FaWindows } from 'react-icons/fa6';
import { VscTerminalLinux } from 'react-icons/vsc';

export default function Download() {
  return (
    <div className="animate-fade-in pt-32 pb-20">
      <BackgroundGrid />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
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

        {/* OS Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* macOS */}
          <DownloadCard
            os="macOS"
            icon={<FaApple />}
            description="Requires macOS 11.0 or later."
            options={[
              { label: 'Universal (.dmg)', note: 'Intel & Apple Silicon' },
            ]}
          />

          {/* Windows */}
          <DownloadCard
            os="Windows"
            icon={<FaWindows />}
            description="Requires Windows 10 or later."
            options={[
              { label: 'Installer (.exe)', note: '64-bit' },
              { label: 'MSI (.msi)', note: '64-bit' },
            ]}
          />

          {/* Linux */}
          <DownloadCard
            os="Linux"
            icon={<VscTerminalLinux />}
            description="Works on most major distributions."
            options={[
              { label: 'Debian (.deb)', note: 'Ubuntu, Debian, Mint' },
              { label: 'AppImage', note: 'Universal' },
            ]}
          />
        </div>

        {/* Checksums */}
        <div className="mt-20 max-w-4xl mx-auto bg-black/30 border border-white/5 rounded-xl p-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Verify Integrity
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            Always verify the integrity of your downloads. You can check the
            SHA-256 sums below.
          </p>
          <div className="bg-black border border-white/10 rounded-lg p-4 font-mono text-xs text-gray-400 overflow-x-auto">
            <div className="mb-2">
              <span className="text-blue-400">
                e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </span>{' '}
              yasumu_1.0.0_universal.dmg
            </div>
            <div className="mb-2">
              <span className="text-blue-400">
                88d4266fd4e6338d13b845fcf289579d209c897823b9217da3e161936f031589
              </span>{' '}
              Yasumu-Setup-1.0.0.exe
            </div>
            <div>
              <span className="text-blue-400">
                039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81
              </span>{' '}
              yasumu_1.0.0_amd64.deb
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DownloadOption {
  label: string;
  note?: string;
  code?: string;
}

const DownloadCard: React.FC<{
  os: string;
  icon: React.ReactNode;
  description: string;
  options: DownloadOption[];
}> = ({ os, icon, description, options }) => {
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
