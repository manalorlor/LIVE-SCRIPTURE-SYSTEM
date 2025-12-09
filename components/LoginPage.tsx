import React, { useState } from 'react';

interface LoginPageProps {
  onLoginSuccess: (churchName: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [churchName, setChurchName] = useState('');

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (churchName.trim()) {
      onLoginSuccess(churchName);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-200/20 dark:from-amber-900/10 via-slate-50 dark:via-slate-950 to-slate-50 dark:to-slate-950 pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10 transition-colors">
        
        <div className="text-center mb-8">
            <div className="inline-block bg-amber-500/20 p-3 rounded-xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-amber-600 dark:text-amber-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
            </div>
            <h1 className="font-heading text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-wider">SCRIPTURE LIVE</h1>
            <p className="text-slate-500 text-sm mt-2">Service Setup</p>
        </div>

        <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Enter the name of your organization to begin.</p>
             </div>
             
             <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Church / Organization Name</label>
                <input 
                    type="text" 
                    placeholder="e.g. Grace Community Church" 
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                    autoFocus
                    required
                />
             </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg"
            >
              Enter Dashboard
            </button>
        </form>
      </div>
    </div>
  );
};