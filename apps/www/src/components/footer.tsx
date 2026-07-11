import Link from 'next/link';
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-background-dark relative z-10 border-t border-white/10 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row lg:px-8">
        <div className="flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo-dark-glow.png"
              alt="Yasumu Logo"
              className="h-6 w-6 rounded-md select-none"
              draggable={false}
            />
            <span className="text-lg font-bold text-white">Yasumu</span>
          </Link>
          <p className="text-sm text-gray-500">The modern API laboratory for developers.</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <span>© {new Date().getFullYear()}</span>
            <a
              href="https://neplextech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              Neplex
            </a>
          </div>
        </div>

        <div className="flex gap-16 text-sm">
          <div className="flex flex-col gap-3">
            <h4 className="font-medium text-white">Project</h4>
            <a
              href="https://discord.yasumu.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 transition-colors hover:text-white"
            >
              Discord
            </a>
            <a
              href="https://github.com/neplextech/yasumu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 transition-colors hover:text-white"
            >
              GitHub
            </a>
            <a
              href="https://github.com/neplextech/yasumu/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 transition-colors hover:text-white"
            >
              Contributing
            </a>
            <Link href="/changelog" className="text-gray-500 transition-colors hover:text-white">
              Changelog
            </Link>
            <Link href="/sponsor" className="text-gray-500 transition-colors hover:text-white">
              Sponsor
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="font-medium text-white">Legal</h4>
            <a
              href="https://github.com/neplextech/yasumu/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 transition-colors hover:text-white"
            >
              License
            </a>
            <a
              href="https://github.com/neplextech/yasumu/blob/main/CODE_OF_CONDUCT.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 transition-colors hover:text-white"
            >
              Code of Conduct
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
