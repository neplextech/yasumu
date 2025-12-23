import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-background-dark py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <img
            src="https://github.com/yasumu-org.png"
            alt="Yasumu Logo"
            className="w-6 h-6 rounded"
          />
          <span className="font-bold text-white tracking-tight">Yasumu</span>
          <span className="text-gray-600 text-sm ml-2">© 2024</span>
        </div>
        <div className="flex gap-8 text-sm">
          <Link
            to="/privacy"
            className="text-gray-500 hover:text-white transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="text-gray-500 hover:text-white transition-colors"
          >
            Terms
          </Link>
          <a
            href="https://github.com/neplextech/yasumu"
            className="text-gray-500 hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://twitter.com"
            className="text-gray-500 hover:text-white transition-colors"
          >
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
