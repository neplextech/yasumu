import React from 'react';

const AppPreview: React.FC = () => {
  return (
    <div className="relative rounded-xl border border-white/10 bg-surface-dark shadow-2xl overflow-hidden ring-1 ring-white/5">
      {/* Title Bar */}
      <div className="h-10 border-b border-white/5 bg-black/40 flex items-center px-4 justify-between backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
        </div>
        <div className="text-xs font-mono text-gray-500">
          test-workspace — yasumu
        </div>
        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex h-[500px] md:h-[600px] bg-background-dark/50 backdrop-blur-xl">
        {/* Sidebar */}
        <div className="w-64 border-r border-white/5 bg-black/20 hidden md:flex flex-col">
          <div className="p-4 flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase tracking-widest font-semibold">
            <span>Requests</span>
            <span className="material-symbols-outlined text-sm cursor-pointer hover:text-white">
              create_new_folder
            </span>
          </div>
          <div className="flex flex-col gap-1 px-2">
            <div className="px-3 py-2 rounded flex items-center gap-3 text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200 cursor-pointer transition-colors">
              <span className="text-[10px] font-bold text-green-500 w-8 text-right font-mono">
                GET
              </span>{' '}
              <span className="truncate">Todo 1</span>
            </div>
            <div className="px-3 py-2 rounded flex items-center gap-3 text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200 cursor-pointer transition-colors">
              <span className="text-[10px] font-bold text-green-500 w-8 text-right font-mono">
                GET
              </span>{' '}
              <span className="truncate">Health Check</span>
            </div>
            <div className="px-3 py-2 rounded bg-white/5 border border-white/5 flex items-center gap-3 text-sm text-white cursor-pointer shadow-sm">
              <span className="text-[10px] font-bold text-blue-500 w-8 text-right font-mono">
                POST
              </span>{' '}
              <span className="truncate">Create User</span>
            </div>
          </div>
        </div>

        {/* Request Panel */}
        <div className="flex-1 flex flex-col bg-transparent">
          {/* URL Bar Area */}
          <div className="p-4 border-b border-white/5">
            <div className="flex gap-0 text-sm font-mono mb-6 border-b border-white/5 w-full">
              <div className="px-4 py-2 border-b border-blue-500 text-blue-400 bg-blue-500/5 flex items-center gap-2">
                Create User{' '}
                <span className="text-gray-500 hover:text-white cursor-pointer ml-1">
                  ×
                </span>
              </div>
              <div className="px-4 py-2 text-gray-500 hover:text-gray-300 cursor-pointer hover:bg-white/5 transition-colors">
                Health Check
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative w-28 flex-shrink-0">
                <select className="w-full bg-accent-dark border border-white/10 text-blue-400 font-bold text-xs rounded-md px-3 py-2.5 appearance-none focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500 transition-all cursor-pointer">
                  <option>POST</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-2.5 text-gray-500 text-sm pointer-events-none">
                  expand_more
                </span>
              </div>
              <input
                className="flex-1 bg-accent-dark border border-white/10 text-gray-300 text-sm rounded-md px-4 py-2.5 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500 transition-all placeholder-gray-600"
                type="text"
                readOnly
                defaultValue="https://echo.yasumu.local/users/:id?delay=3000"
              />
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-md text-sm font-semibold transition-all shadow-lg shadow-blue-900/20">
                Send
              </button>
            </div>
          </div>

          {/* Request/Response Split */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Request Details */}
            <div className="flex-1 border-r border-white/5 p-4 flex flex-col gap-4">
              <div className="flex gap-6 border-b border-white/5 pb-0">
                <button className="text-xs font-medium text-white pb-3 border-b-2 border-blue-500 transition-colors uppercase tracking-wider">
                  Params
                </button>
                <button className="text-xs font-medium text-gray-500 hover:text-gray-300 pb-3 border-b-2 border-transparent transition-colors uppercase tracking-wider">
                  Headers
                </button>
                <button className="text-xs font-medium text-gray-500 hover:text-gray-300 pb-3 border-b-2 border-transparent transition-colors uppercase tracking-wider">
                  Body
                </button>
                <button className="text-xs font-medium text-gray-500 hover:text-gray-300 pb-3 border-b-2 border-transparent transition-colors uppercase tracking-wider">
                  Auth
                </button>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-[10px] text-gray-500 mb-2 uppercase tracking-wide font-semibold">
                    Path Variables
                  </h4>
                  <div className="grid grid-cols-12 gap-2 mb-2 items-center">
                    <div className="col-span-4 bg-accent-dark border border-white/10 rounded px-3 py-2 text-sm text-gray-400 font-mono">
                      id
                    </div>
                    <div className="col-span-8 bg-accent-dark border border-white/10 rounded px-3 py-2 text-sm text-gray-300 font-mono">
                      4543643636436
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] text-gray-500 mb-2 uppercase tracking-wide font-semibold">
                    Query Params
                  </h4>
                  <div className="grid grid-cols-12 gap-2 mb-2 items-center">
                    <div className="col-span-4 bg-accent-dark border border-white/10 rounded px-3 py-2 text-sm text-gray-400 font-mono">
                      delay
                    </div>
                    <div className="col-span-8 bg-accent-dark border border-white/10 rounded px-3 py-2 text-sm text-gray-300 font-mono">
                      3000
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Panel */}
            <div className="flex-1 bg-black/20 p-4 font-mono text-xs overflow-hidden relative flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                <div className="flex gap-3 items-center">
                  <span className="text-green-400 bg-green-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-green-500/20">
                    200 OK
                  </span>
                  <span className="text-gray-500 text-[10px]">3025ms</span>
                  <span className="text-gray-500 text-[10px]">412 B</span>
                </div>
                <div className="flex gap-4 text-gray-500 text-[10px] uppercase font-semibold tracking-wider">
                  <span className="text-white border-b border-white cursor-pointer">
                    Preview
                  </span>
                  <span className="hover:text-gray-300 cursor-pointer">
                    Headers
                  </span>
                  <span className="hover:text-gray-300 cursor-pointer">
                    Raw
                  </span>
                </div>
              </div>
              <div className="text-gray-300 leading-relaxed overflow-auto custom-scrollbar flex-1">
                <pre>
                  {`{
  "url": "http://localhost:55770/users...",
  "method": "POST",
  "headers": {
    "accept": "*/*",
    "host": "localhost:55770"
  },
  "meta": {
    "timestamp": "2025-12-23T13:25:43.463Z",
    "source": "tanxium-echo-server"
  }
}`
                    .split('\n')
                    .map((line, i) => {
                      // Simple syntax highlighting simulation
                      const parts = line.split(':');
                      if (parts.length > 1) {
                        return (
                          <div key={i}>
                            <span className="text-purple-400">{parts[0]}:</span>
                            <span className="text-green-400">
                              {parts.slice(1).join(':')}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div key={i} className="text-gray-400">
                          {line}
                        </div>
                      );
                    })}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPreview;
