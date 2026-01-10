'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdOpenInNew, MdMenu, MdClose } from 'react-icons/md';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Area */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/logo-dark-glow.png"
                alt="Yasumu Logo"
                className="select-none w-8 h-8 rounded-lg"
                draggable={false}
              />
              <span className="font-bold text-xl tracking-tight text-white group-hover:text-gray-200 transition-colors">
                Yasumu
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="https://docs.yasumu.dev"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-text-secondary hover:text-white transition-colors duration-200"
            >
              Documentation
            </a>
            <Link
              href="/changelog"
              className={`text-sm font-medium transition-colors duration-200 ${isActive('/changelog') ? 'text-white' : 'text-text-secondary hover:text-white'}`}
            >
              Changelog
            </Link>
            <Link
              href="/sponsor"
              className={`text-sm font-medium transition-colors duration-200 ${isActive('/sponsor') ? 'text-white' : 'text-text-secondary hover:text-white'}`}
            >
              Sponsor
            </Link>
            <a
              href="https://github.com/neplextech/yasumu"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-text-secondary hover:text-white transition-colors duration-200 flex items-center gap-1"
            >
              GitHub
              <MdOpenInNew className="text-[16px]" />
            </a>
            <a
              href="https://discord.yasumu.dev"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-text-secondary hover:text-white transition-colors duration-200 flex items-center gap-1"
            >
              Discord
              <MdOpenInNew className="text-[16px]" />
            </a>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-4">
            <Link
              href="/download"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-black bg-white hover:bg-gray-200 transition-all shadow-lg hover:shadow-white/20"
            >
              Download
            </Link>
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-400 hover:text-white p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <MdClose className="text-2xl" />
              ) : (
                <MdMenu className="text-2xl" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-background-dark border-b border-white/10">
          <div className="px-4 pt-2 pb-4 space-y-1 flex flex-col">
            <Link
              href="/changelog"
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-md"
            >
              Changelog
            </Link>
            <Link
              href="/sponsor"
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-md"
            >
              Sponsor
            </Link>
            <a
              href="https://docs.yasumu.dev"
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-md"
            >
              Documentation
            </a>
            <a
              href="https://github.com/neplextech/yasumu"
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-md"
            >
              GitHub
            </a>
            <Link
              href="/download"
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-black bg-white rounded-md mt-4 text-center"
            >
              Download
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
