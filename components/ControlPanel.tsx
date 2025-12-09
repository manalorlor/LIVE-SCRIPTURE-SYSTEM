import React from 'react';
import { ConnectionStatus } from '../types';

interface ControlPanelProps {
  status: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  isAudioProcessing: boolean;
  autoRead: boolean;
  toggleAutoRead: () => void;
  isSpeaking: boolean;
  toggleSpeak: () => void;
  hasVerse: boolean;
  translation?: string;
  onTranslationChange?: (val: string) => void;
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
    status, 
    onConnect, 
    onDisconnect, 
    isAudioProcessing,
    autoRead,
    toggleAutoRead,
    isSpeaking,
    toggleSpeak,
    hasVerse,
    translation = 'NKJV',
    onTranslationChange,
    theme = 'dark',
    toggleTheme
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between shadow-2xl gap-4 transition-colors duration-300">
      {/* Connection Controls */}
      <div className="flex items-center gap-4">
        {status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR ? (
          <button
            onClick={onConnect}
            title="Connect to the microphone to start detecting verses and voice commands."
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-emerald-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
              <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 9.351v2.149h2.25a.75.75 0 010 1.5h-6a.75.75 0 010-1.5h2.25v-2.149a6.751 6.751 0 01-6-9.351v-1.5A.75.75 0 016 10.5z" />
            </svg>
            {status === ConnectionStatus.ERROR ? 'Retry Connection' : 'Start Listening'}
          </button>
        ) : (
          <button
            onClick={onDisconnect}
            title="Disconnect from the service and stop listening."
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-rose-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
            </svg>
            Stop Listening
          </button>
        )}
        
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors" title="Current connection status to the AI service.">
            <div className={`w-3 h-3 rounded-full ${status === ConnectionStatus.CONNECTED ? 'bg-green-500 animate-pulse' : status === ConnectionStatus.CONNECTING ? 'bg-yellow-500' : status === ConnectionStatus.ERROR ? 'bg-red-500' : 'bg-slate-500'}`}></div>
            <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-300">
                {status === ConnectionStatus.CONNECTED ? 'Live' : status === ConnectionStatus.CONNECTING ? 'Connecting...' : status === ConnectionStatus.ERROR ? 'Connection Failed' : 'Offline'}
            </span>
        </div>
      </div>
      
      {/* Error Message Hint */}
      {status === ConnectionStatus.ERROR && (
         <div className="text-red-500 dark:text-red-400 text-xs md:text-sm font-medium animate-pulse">
            Check API Key & Network
         </div>
      )}

      <div className="flex items-center gap-4">
        {/* Version Selector */}
        {onTranslationChange && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-2 rounded-xl transition-colors">
                 <select 
                    value={translation}
                    onChange={(e) => onTranslationChange(e.target.value)}
                    className="bg-transparent text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg px-2 border-none focus:ring-0 outline-none cursor-pointer"
                    title="Select Bible Version"
                 >
                    <option value="NKJV">NKJV</option>
                    <option value="NLT">NLT</option>
                    <option value="KJV">KJV</option>
                    <option value="WEB">WEB</option>
                 </select>
            </div>
        )}

        {/* Reading & Theme Controls */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-xl transition-colors">
            {/* Toggle Auto-Read */}
            <button 
                onClick={toggleAutoRead}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${autoRead ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                title="When enabled, verses will be read aloud automatically as soon as they are displayed."
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                    <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                </svg>
                <span className="hidden sm:inline">Read</span>
            </button>

            {/* Manual Play/Stop */}
            <button 
                onClick={toggleSpeak}
                disabled={!hasVerse}
                className={`p-2 rounded-full transition-all ${
                    !hasVerse ? 'opacity-30 cursor-not-allowed text-slate-400' :
                    isSpeaking ? 'bg-rose-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
                title={isSpeaking ? "Stop" : "Speak Now"}
            >
                {isSpeaking ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                )}
            </button>

            {/* Theme Toggle */}
            {toggleTheme && (
                <button
                    onClick={toggleTheme}
                    className="ml-2 p-2 rounded-full bg-white dark:bg-slate-700 text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                    {theme === 'dark' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                    )}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};