import React, { useEffect, useRef } from 'react';
import { Verse } from '../types';

interface VerseDisplayProps {
  verse: Verse | null;
  isLoading: boolean;
  isSpeaking: boolean;
  readingProgress?: number;
  emptyMessage?: string;
  subMessage?: string;
}

export const VerseDisplay: React.FC<VerseDisplayProps> = ({ 
  verse, 
  isLoading, 
  isSpeaking,
  readingProgress = 0,
  emptyMessage = "Listening for scripture...", 
  subMessage = "Try saying 'Read John 3:16'" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic synchronized with reading progress
  useEffect(() => {
    const container = containerRef.current;
    
    // Only scroll if speaking and we have a container
    if (!isSpeaking || !container || !verse) {
      return;
    }

    // Calculate target position to center the current reading point.
    // Progress is 0.0 to 1.0.
    // scrollHeight * progress gives us the pixel approximation of where we are in the document.
    // Subtracting half the clientHeight attempts to put that pixel in the middle of the viewport.
    const targetScrollTop = (container.scrollHeight * readingProgress) - (container.clientHeight / 2);

    container.scrollTo({
        top: targetScrollTop,
        behavior: 'auto' // Use auto to prevent smooth scroll lag behind the voice
    });

  }, [isSpeaking, readingProgress, verse]);

  // Reset scroll position when the verse reference changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [verse?.reference]);

  if (isLoading) {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center p-12">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-64 bg-slate-200 dark:bg-white/10 rounded"></div>
          <div className="h-4 w-96 bg-slate-200 dark:bg-white/10 rounded"></div>
          <div className="h-4 w-80 bg-slate-200 dark:bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (!verse) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 dark:text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        <p className="text-xl font-light">{emptyMessage}</p>
        <p className="text-sm mt-2 opacity-60">{subMessage}</p>
      </div>
    );
  }

  const isLongText = verse.text.length > 500;
  const fontSizeClass = isLongText ? "text-lg md:text-xl" : "text-2xl md:text-4xl";

  return (
    <div ref={containerRef} className="flex-1 w-full h-full overflow-y-auto scroll-smooth">
      <div className="min-h-full flex flex-col items-center justify-center p-8 md:p-16">
        <div className="max-w-5xl w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-8 sticky top-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm py-4 z-10 transition-colors">
             {/* Display Title (e.g. "The Good Samaritan") if available, otherwise just Reference */}
             {verse.title && (
               <h3 className="font-heading text-xl md:text-2xl text-amber-600 dark:text-amber-500/80 mb-1 uppercase tracking-widest">
                  {verse.title}
               </h3>
             )}
             <h2 className="font-heading text-4xl md:text-6xl text-slate-900 dark:text-slate-100 font-bold tracking-tight mb-2 drop-shadow-sm dark:drop-shadow-lg">
              {verse.reference}
            </h2>
            {verse.translation_name && (
              <span className="text-sm md:text-base text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {verse.translation_name}
              </span>
            )}
          </div>
          
          <div className="relative mb-12">
             {!isLongText && <span className="absolute -top-8 -left-8 text-8xl text-slate-200 dark:text-white/5 font-serif-display select-none">“</span>}
            <p className={`font-serif-display ${fontSizeClass} leading-relaxed text-slate-800 dark:text-slate-100 text-center px-4 md:px-12 drop-shadow-sm md:drop-shadow-md whitespace-pre-wrap`}>
              {verse.text}
            </p>
            {!isLongText && <span className="absolute -bottom-16 -right-8 text-8xl text-slate-200 dark:text-white/5 font-serif-display select-none">”</span>}
          </div>
        </div>
      </div>
    </div>
  );
};