import { BackgroundGrid } from '../../components/background-grid';
import { FaApple, FaWindows } from 'react-icons/fa6';
import { VscTerminalLinux } from 'react-icons/vsc';
import { DownloadCard } from './download-card';

const downloadLinks = {
  macOS: {
    intel: {
      url: 'https://github.com/neplextech/yasumu/releases/latest/download/yasumu_universal.dmg',
      filename: 'yasumu_universal.dmg',
    },
    appleSilicon: {
      url: 'https://github.com/neplextech/yasumu/releases/latest/download/yasumu_universal.dmg',
      filename: 'yasumu_universal.dmg',
    },
  },
  Windows: {
    installer: {
      url: 'https://github.com/neplextech/yasumu/releases/latest/download/yasumu-setup.exe',
      filename: 'yasumu-setup.exe',
    },
    msi: {
      url: 'https://github.com/neplextech/yasumu/releases/latest/download/yasumu-setup.msi',
      filename: 'yasumu-setup.msi',
    },
  },
  Linux: {
    debian: {
      url: 'https://github.com/neplextech/yasumu/releases/latest/download/yasumu_amd64.deb',
      filename: 'yasumu_amd64.deb',
    },
    appimage: {
      url: 'https://github.com/neplextech/yasumu/releases/latest/download/yasumu_amd64.AppImage',
      filename: 'yasumu_amd64.AppImage',
    },
  },
};

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
              {
                label: 'Universal (.dmg)',
                note: 'Intel & Apple Silicon',
                url: downloadLinks.macOS.intel.url,
              },
            ]}
          />

          {/* Windows */}
          <DownloadCard
            os="Windows"
            icon={<FaWindows />}
            description="Requires Windows 10 or later."
            options={[
              {
                label: 'Installer (.exe)',
                note: '64-bit',
                url: downloadLinks.Windows.installer.url,
              },
              {
                label: 'MSI (.msi)',
                note: '64-bit',
                url: downloadLinks.Windows.msi.url,
              },
            ]}
          />

          {/* Linux */}
          <DownloadCard
            os="Linux"
            icon={<VscTerminalLinux />}
            description="Works on most major distributions."
            options={[
              {
                label: 'Debian (.deb)',
                note: 'Ubuntu, Debian, etc.',
                url: downloadLinks.Linux.debian.url,
              },
              {
                label: 'AppImage',
                note: 'Universal',
                url: downloadLinks.Linux.appimage.url,
              },
            ]}
          />
        </div>

        {/* Release Info */}
        <div className="mt-20 max-w-4xl mx-auto bg-black/30 border border-white/5 rounded-xl p-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Latest Release
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            Downloads are always from the latest stable release. You can also
            view{' '}
            <a
              href="https://github.com/neplextech/yasumu/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              all releases on GitHub
            </a>{' '}
            to access previous versions or checksums.
          </p>
          <div className="bg-black border border-white/10 rounded-lg p-4 font-mono text-xs text-gray-400 overflow-x-auto">
            <div className="mb-2">
              <span className="text-green-400">✓</span>{' '}
              <span className="text-blue-400">Latest stable release</span>
            </div>
            <div className="mb-2">
              <span className="text-green-400">✓</span>{' '}
              <span className="text-blue-400">Automatic updates included</span>
            </div>
            <div>
              <span className="text-green-400">✓</span>{' '}
              <span className="text-blue-400">Digitally signed binaries</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
