import React from 'react';
import { AppMode } from '../types';

interface TabNavigationProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ currentMode, onModeChange }) => {
  const tabs = [
    { id: AppMode.HOME, label: 'Home' },
    { id: AppMode.BIBLE, label: 'Bible' },
    { id: AppMode.STORY, label: 'Stories' },
    { id: AppMode.PARABLE, label: 'Parables' },
    { id: AppMode.SONG, label: 'Songs' },
  ];

  return (
    <div className="flex justify-center gap-1 p-1 bg-slate-900/50 backdrop-blur rounded-full border border-slate-800/50 overflow-x-auto max-w-[90vw]">
      {tabs.map((tab) => {
        const isActive = currentMode === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onModeChange(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
              isActive
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};