import React from 'react';
import { AppMode } from '../types';

interface HomeViewProps {
  churchName: string;
  onNavigate: (mode: AppMode) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ churchName, onNavigate }) => {
  return (
    <div className="flex-1 w-full h-full overflow-y-auto scroll-smooth">
      <div className="min-h-full flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="max-w-4xl w-full text-center space-y-12">
          
          {/* Welcome Section */}
          <div className="space-y-4">
            <h2 className="text-amber-600 dark:text-amber-500 font-heading text-2xl tracking-widest uppercase opacity-80">Welcome to</h2>
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-slate-800 dark:text-slate-100 drop-shadow-2xl">
              {churchName || "The House of God"}
            </h1>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            
            <button 
              onClick={() => onNavigate(AppMode.BIBLE)}
              className="group relative bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-amber-500/30"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Live Bible</h3>
              <p className="text-xs text-slate-500">Verse display</p>
            </button>

            <button 
              onClick={() => onNavigate(AppMode.STORY)}
              className="group relative bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-amber-500/30"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Stories</h3>
              <p className="text-xs text-slate-500">Key narratives</p>
            </button>

            <button 
              onClick={() => onNavigate(AppMode.PARABLE)}
              className="group relative bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-amber-500/30"
            >
               <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Parables</h3>
              <p className="text-xs text-slate-500">Wisdom of Jesus</p>
            </button>

             <button 
              onClick={() => onNavigate(AppMode.SONG)}
              className="group relative bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-amber-500/30"
            >
               <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Songs</h3>
              <p className="text-xs text-slate-500">Hymns & Lyrics</p>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};