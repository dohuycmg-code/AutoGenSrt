import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-4 sm:px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">AudioScribe AI</h1>
            <p className="text-xs text-slate-400 font-medium">Tạo subtitles </p>
          </div>
        </div>
        <div className="hidden sm:block">
           <span className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-400 border border-slate-700">
             v1.0.0
           </span>
        </div>
      </div>
    </header>
  );
};