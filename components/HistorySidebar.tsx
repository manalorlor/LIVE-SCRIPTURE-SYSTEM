import React from 'react';
import { Verse } from '../types';

interface HistorySidebarProps {
  history: Verse[];
  onSelect: (verse: Verse) => void;
  isOpen: boolean;
  toggle: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onSelect, isOpen, toggle }) => {
  return (
    <div className={`fixed right-0 top-0 h-full bg-slate-900/95 backdrop-blur-md border-l border-slate-800 w-80 transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-heading font-bold text-lg text-slate-200">History</h3>
        <button onClick={toggle} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="overflow-y-auto h-[calc(100%-64px)] p-4 space-y-3">
        {history.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No scriptures detected yet.</p>
        ) : (
          history.map((item, idx) => (
            <button
              key={`${item.reference}-${idx}`}
              onClick={() => onSelect(item)}
              className="w-full text-left p-3 rounded bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all group"
            >
              <div className="text-amber-400 font-bold text-sm mb-1 group-hover:text-amber-300">{item.reference}</div>
              <div className="text-slate-400 text-xs line-clamp-2 font-serif-display">{item.text}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};