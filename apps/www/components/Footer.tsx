import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-background-dark py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="https://github.com/yasumu-org.png"
              alt="Yasumu Logo"
              className="w-6 h-6 rounded select-none"
              draggable={false}
            />
            <span className="font-bold text-white tracking-tight">Yasumu</span>
          </Link>
          <span className="text-gray-600 text-sm ml-2 flex items-center gap-2">
            <span>©</span>
            <a
              href="https://neplextech.com?utm_source=yasumu&utm_medium=footer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline text-gray-600 hover:text-white transition-colors"
            >
              <span>Neplex</span>
            </a>{' '}
            {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex gap-8 text-sm">
          <a
            href="https://github.com/neplextech/yasumu/blob/main/CODE_OF_CONDUCT.md"
            className="text-gray-500 hover:text-white transition-colors"
          >
            Code of Conduct
          </a>
          <a
            href="https://github.com/neplextech/yasumu/blob/main/LICENSE"
            className="text-gray-500 hover:text-white transition-colors"
          >
            AGPL-3.0 License
          </a>
          <a
            href="https://github.com/neplextech/yasumu/blob/main/CONTRIBUTING.md"
            className="text-gray-500 hover:text-white transition-colors"
          >
            Contributing
          </a>
          <a
            href="https://github.com/neplextech/yasumu"
            className="text-gray-500 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
