import React from 'react';

const Download: React.FC = () => {
  return (
    <div className="animate-fade-in pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm cursor-default">
            <span className="text-xs font-mono font-medium text-gray-400">
              Version 1.0.0
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
            icon={
              <svg
                className="w-8 h-8 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.55 1.44-.05 2.5-.9 3.51-.7 1.07-2.6 1.44-3.1 3.55 1.15.54 2.8-.56 4.05-1.94.88-1.02 1.55-2.53.95-3.62z" />
              </svg>
            }
            description="Requires macOS 11.0 or later."
            options={[
              { label: 'Universal (.dmg)', note: 'Intel & Apple Silicon' },
              { label: 'Homebrew', code: 'brew install yasumu' },
            ]}
          />

          {/* Windows */}
          <DownloadCard
            os="Windows"
            icon={
              <svg
                className="w-8 h-8 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
              </svg>
            }
            description="Requires Windows 10 or later."
            options={[
              { label: 'Installer (.exe)', note: '64-bit' },
              { label: 'Portable (.zip)', note: 'No installation required' },
            ]}
          />

          {/* Linux */}
          <DownloadCard
            os="Linux"
            icon={
              <svg
                className="w-8 h-8 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0c-4.418 0-8 3.582-8 8v1h-2v4h2v2h-1v4h2c0 2.209 1.791 4 4 4h6c2.209 0 4-1.791 4-4h2v-4h-1v-2h2v-4h-2v-1c0-4.418-3.582-8-8-8zm-1 3h2v2h-2v-2zm-3 5h2v2h-2v-2zm6 0h2v2h-2v-2z" />
              </svg>
            }
            description="Works on most major distributions."
            options={[
              { label: 'Debian (.deb)', note: 'Ubuntu, Debian, Mint' },
              { label: 'AppImage', note: 'Universal' },
              { label: 'RPM (.rpm)', note: 'Fedora, RHEL' },
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
};

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

      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white mb-6 border border-white/10">
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
              <span className="material-symbols-outlined text-gray-500 text-sm group-hover/btn:text-white">
                download
              </span>
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

export default Download;
