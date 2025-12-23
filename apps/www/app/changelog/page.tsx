import React from 'react';
import { BackgroundGrid } from '../../components/BackgroundGrid';
import { MdAddCircle, MdBuild } from 'react-icons/md';

export default function Changelog() {
  return (
    <div className="animate-fade-in pt-32 pb-20">
      <BackgroundGrid />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
            Changelog
          </h1>
          <p className="text-lg text-text-secondary">
            Stay up to date with the latest features and improvements.
          </p>
        </div>

        <div className="relative border-l border-white/10 ml-4 md:ml-6 space-y-16">
          {/* Release 1.0.0 */}
          <div className="relative pl-8 md:pl-12">
            <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-background-dark"></span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-white">v1.0.0</h2>
              <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
                Latest Release
              </span>
              <span className="text-sm text-text-secondary font-mono">
                December 23, 2024
              </span>
            </div>

            <div className="prose prose-invert prose-sm max-w-none text-gray-400">
              <p className="text-base text-gray-300 mb-4">
                The first major release of Yasumu is here! We've rebuilt the
                core engine in Rust for better performance and introduced a
                completely new interface.
              </p>

              <h3 className="text-white font-semibold mt-6 mb-3 flex items-center gap-2">
                <MdAddCircle className="text-green-400 text-sm" /> New Features
              </h3>
              <ul className="space-y-2 list-none pl-0">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Native Performance:</strong> Rewritten backend using
                    Rust and Tauri v2.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Workspaces:</strong> Create separate environments
                    for different projects.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Variable Support:</strong> Full support for
                    environment variables in URLs, headers, and bodies.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Code Generation:</strong> Export requests to curl,
                    Python, JavaScript, and Go.
                  </span>
                </li>
              </ul>

              <h3 className="text-white font-semibold mt-6 mb-3 flex items-center gap-2">
                <MdBuild className="text-purple-400 text-sm" /> Improvements
              </h3>
              <ul className="space-y-2 list-none pl-0">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 flex-shrink-0"></span>
                  <span>
                    Reduced memory usage by 60% compared to Electron-based
                    alternatives.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 flex-shrink-0"></span>
                  <span>
                    Dark mode is now the default and only theme (as requested).
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Release 0.9.5 */}
          <div className="relative pl-8 md:pl-12 opacity-75">
            <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-white/20 ring-4 ring-background-dark"></span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-300">v0.9.5</h2>
              <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-white/5 text-gray-400 border border-white/10 w-fit">
                Beta
              </span>
              <span className="text-sm text-text-secondary font-mono">
                November 10, 2024
              </span>
            </div>

            <div className="prose prose-invert prose-sm max-w-none text-gray-400">
              <p className="mb-4">
                Beta release focusing on stability and fixing critical bugs in
                the request runner.
              </p>
              <ul className="space-y-2 list-none pl-0">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 flex-shrink-0"></span>
                  <span>Added support for binary file uploads.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 flex-shrink-0"></span>
                  <span>Fixed issue with timeout settings not persisting.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 flex-shrink-0"></span>
                  <span>Initial implementation of the Plugin system.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* End */}
          <div className="relative pl-8 md:pl-12">
            <span className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-white/10 ring-4 ring-background-dark"></span>
            <div className="text-sm text-gray-600 font-mono pt-1">
              Initial commit - October 2024
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
