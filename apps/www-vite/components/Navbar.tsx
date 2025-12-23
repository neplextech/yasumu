import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Area */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="https://github.com/yasumu-org.png"
                alt="Yasumu Logo"
                className="w-8 h-8 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.15)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-shadow duration-300"
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
              to="/changelog"
              className={`text-sm font-medium transition-colors duration-200 ${isActive('/changelog') ? 'text-white' : 'text-text-secondary hover:text-white'}`}
            >
              Changelog
            </Link>
            <a
              href="https://github.com/neplextech/yasumu"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-text-secondary hover:text-white transition-colors duration-200 flex items-center gap-1"
            >
              GitHub
              <span className="material-symbols-outlined text-[16px]">
                open_in_new
              </span>
            </a>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-4">
            <Link
              to="/download"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-black bg-white hover:bg-gray-200 transition-all shadow-lg hover:shadow-white/20"
            >
              Download
            </Link>
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-400 hover:text-white p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="material-symbols-outlined">
                {isMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-background-dark border-b border-white/10">
          <div className="px-4 pt-2 pb-4 space-y-1 flex flex-col">
            <Link
              to="/changelog"
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-md"
            >
              Changelog
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
              to="/download"
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
