import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background-dark py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo-dark-glow.png"
              alt="Yasumu Logo"
              className="w-6 h-6 rounded-md select-none"
              draggable={false}
            />
            <span className="font-bold text-lg text-white">Yasumu</span>
          </Link>
          <p className="text-gray-500 text-sm">
            The modern API laboratory for developers.
          </p>
          <div className="text-gray-500 text-sm flex items-center gap-2 mt-2">
            <span>© {new Date().getFullYear()}</span>
            <a
              href="https://neplextech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Neplex
            </a>
          </div>
        </div>

        <div className="flex gap-16 text-sm">
          <div className="flex flex-col gap-3">
            <h4 className="font-medium text-white">Project</h4>
            <a
              href="https://github.com/neplextech/yasumu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://github.com/neplextech/yasumu/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors"
            >
              Contributing
            </a>
            <Link
              href="/changelog"
              className="text-gray-500 hover:text-white transition-colors"
            >
              Changelog
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="font-medium text-white">Legal</h4>
            <a
              href="https://github.com/neplextech/yasumu/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors"
            >
              License
            </a>
            <a
              href="https://github.com/neplextech/yasumu/blob/main/CODE_OF_CONDUCT.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors"
            >
              Code of Conduct
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
