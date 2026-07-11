'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { MdOpenInNew, MdMenu, MdClose } from 'react-icons/md';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="glass-panel fixed top-0 z-50 w-full border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Area */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <Link href="/" className="group flex items-center gap-3">
              <img
                src="/logo-dark-glow.png"
                alt="Yasumu Logo"
                className="h-8 w-8 rounded-lg select-none"
                draggable={false}
              />
              <span className="text-xl font-bold tracking-tight text-white transition-colors group-hover:text-gray-200">
                Yasumu
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden items-center space-x-8 md:flex">
            <a
              href="https://docs.yasumu.dev"
              target="_blank"
              rel="noreferrer"
              className="text-text-secondary text-sm font-medium transition-colors duration-200 hover:text-white"
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
              className="text-text-secondary flex items-center gap-1 text-sm font-medium transition-colors duration-200 hover:text-white"
            >
              GitHub
              <MdOpenInNew className="text-[16px]" />
            </a>
            <a
              href="https://discord.yasumu.dev"
              target="_blank"
              rel="noreferrer"
              className="text-text-secondary flex items-center gap-1 text-sm font-medium transition-colors duration-200 hover:text-white"
            >
              Discord
              <MdOpenInNew className="text-[16px]" />
            </a>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-4">
            <Link
              href="/download"
              className="hidden items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black shadow-lg transition-all hover:bg-gray-200 hover:shadow-white/20 sm:inline-flex"
            >
              Download
            </Link>
            {/* Mobile Menu Button */}
            <button className="p-2 text-gray-400 hover:text-white md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <MdClose className="text-2xl" /> : <MdMenu className="text-2xl" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="bg-background-dark border-b border-white/10 md:hidden">
          <div className="flex flex-col space-y-1 px-4 pt-2 pb-4">
            <Link
              href="/changelog"
              onClick={() => setIsMenuOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              Changelog
            </Link>
            <Link
              href="/sponsor"
              onClick={() => setIsMenuOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              Sponsor
            </Link>
            <a
              href="https://docs.yasumu.dev"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              Documentation
            </a>
            <a
              href="https://github.com/neplextech/yasumu"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              GitHub
            </a>
            <Link
              href="/download"
              onClick={() => setIsMenuOpen(false)}
              className="mt-4 block rounded-md bg-white px-3 py-2 text-center text-base font-medium text-black"
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
