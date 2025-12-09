import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LoginPage } from './components/LoginPage';
import { HomeView } from './components/HomeView';
import { VerseDisplay } from './components/VerseDisplay';
import { ControlPanel } from './components/ControlPanel';
import { HistorySidebar } from './components/HistorySidebar';
import { TimeDisplay } from './components/TimeDisplay';
import { TabNavigation } from './components/TabNavigation';
import { ContentList } from './components/ContentList';
import { fetchVerse } from './services/bibleService';
import { GeminiLiveService } from './services/geminiLiveService';
import { Verse, ConnectionStatus, ScriptureReference, AppMode } from './types';
import { STORIES, PARABLES } from './data/bibleData';
import { SONGS, SongItem } from './data/songData';

const App: React.FC = () => {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [churchName, setChurchName] = useState('');

  // App State
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [history, setHistory] = useState<Verse[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingVerse, setIsLoadingVerse] = useState(false);
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.HOME);
  const [translation, setTranslation] = useState<string>('NKJV');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Reading (TTS) State
  const [autoRead, setAutoRead] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  
  const geminiServiceRef = useRef<GeminiLiveService | null>(null);
  const loadContentRequestId = useRef(0);
  // Keep track of active utterances to prevent garbage collection prematurely
  const currentUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  // Text-to-Speech Helper Functions
  const speak = useCallback((text: string) => {
    // Ensure we stop any previous Gemini audio before starting TTS
    geminiServiceRef.current?.interrupt();
    
    window.speechSynthesis.cancel();
    currentUtterancesRef.current = [];
    setReadingProgress(0);
    
    // Chunk the text by sentences to avoid browser TTS timeout on long texts.
    // Use regex that captures the delimiters to preserve text structure.
    const chunks = text.match(/[^\.!\?]+[\.!\?]+(["']?)|.+$/g) || [text];
    
    const totalLength = text.length;
    let currentOffset = 0;
    
    // Set speaking state immediately
    setIsSpeaking(true);

    chunks.forEach((chunk, index) => {
        // Use full chunk to maintain index fidelity with the original text
        const utterance = new SpeechSynthesisUtterance(chunk);
        
        // Store in ref to prevent Garbage Collection which causes "interrupted" or "network" errors in Chrome
        currentUtterancesRef.current.push(utterance);
        
        const chunkStart = currentOffset;

        // Monitor boundary events to update progress
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const globalIndex = chunkStart + event.charIndex;
                const progress = globalIndex / totalLength;
                setReadingProgress(progress);
            }
        };

        // When this chunk ends, remove it from ref to allow cleanup
        utterance.onend = () => {
            currentUtterancesRef.current = currentUtterancesRef.current.filter(u => u !== utterance);
            // Only the last chunk determines when we stop speaking state
            if (index === chunks.length - 1) {
                setIsSpeaking(false);
                setReadingProgress(1); // Ensure it finishes at the end
            }
        };

        utterance.onerror = (e) => {
            // Ignore errors caused by manual cancellation or interruption
            if (e.error === 'canceled' || e.error === 'interrupted') {
                return;
            }
            
            console.warn("TTS Chunk Error:", e.error);
            
            // If it's the last chunk and it failed, reset state
            if (index === chunks.length - 1) {
                setIsSpeaking(false);
            }
        };
        
        window.speechSynthesis.speak(utterance);
        currentOffset += chunk.length;
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    currentUtterancesRef.current = []; // Clear refs
    setIsSpeaking(false);
    // Also stop Gemini singing/audio
    geminiServiceRef.current?.interrupt();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Generic Verse Fetcher
  const loadContent = useCallback(async (ref: ScriptureReference, title?: string) => {
    const requestId = ++loadContentRequestId.current;
    setIsLoadingVerse(true);
    
    try {
      const verse = await fetchVerse(ref, title, translation);
      
      // If a newer request has started, ignore this result
      if (requestId !== loadContentRequestId.current) return;
  
      setIsLoadingVerse(false);
      
      if (verse) {
        setCurrentVerse(verse);
        // Avoid duplicate top entry if just translation changed
        setHistory(prev => {
            if (prev.length > 0 && prev[0].reference === verse.reference && prev[0].translation_name !== verse.translation_name) {
                return [verse, ...prev.slice(1)];
            }
            return [verse, ...prev];
        });
        if (autoRead) speak(verse.text);
      }
    } catch (e) {
      if (requestId === loadContentRequestId.current) {
         setIsLoadingVerse(false);
      }
      console.error("Failed to load content", e);
    }
  }, [autoRead, speak, translation]);

  // Reload content when translation changes
  useEffect(() => {
    if (currentVerse && currentMode === AppMode.BIBLE && currentVerse.book_name && currentVerse.chapter) {
        // Re-construct reference
        const ref: ScriptureReference = {
            book: currentVerse.book_name,
            chapter: currentVerse.chapter,
            verse: currentVerse.verse ? String(currentVerse.verse) : undefined
        };
        // We only reload if the current displayed translation is different
        if (currentVerse.translation_name !== translation) {
            loadContent(ref, currentVerse.title);
        }
    }
  }, [translation, currentVerse, currentMode, loadContent]);

  const loadSong = useCallback((song: SongItem) => {
    const verseObj: Verse = {
      reference: song.author, // Display author as the reference/subtitle
      text: song.lyrics,
      title: song.title,
      // Fake bible ref properties
      book_name: "Hymnal",
      chapter: 1,
      verse: 1
    };
    setCurrentVerse(verseObj);
    setHistory(prev => [verseObj, ...prev]);
    // Songs are sung by Gemini, not read by TTS.
  }, []);

  const handleVerseDetected = useCallback(async (ref: ScriptureReference) => {
    // If user asks for a verse, switch to BIBLE mode automatically to show it
    if (currentMode !== AppMode.BIBLE) setCurrentMode(AppMode.BIBLE);
    loadContent(ref);
  }, [currentMode, loadContent]);

  const handleContentDetected = useCallback(async (title: string, ref: ScriptureReference, mode: AppMode) => {
    setCurrentMode(mode);
    
    // Normalize title for fuzzy matching
    const searchTitle = title.toLowerCase();

    if (mode === AppMode.SONG) {
        const foundSong = SONGS.find(s => s.title.toLowerCase().includes(searchTitle) || searchTitle.includes(s.title.toLowerCase()));
        if (foundSong) {
            loadSong(foundSong);
        } else {
            setCurrentVerse({
                reference: "Unknown Song",
                text: "Lyrics not found in the local library.",
                title: title,
            });
        }
    } else if (mode === AppMode.STORY) {
        // Try to find the story in local data to get the accurate reference
        const foundStory = STORIES.find(s => s.title.toLowerCase().includes(searchTitle) || searchTitle.includes(s.title.toLowerCase()));
        if (foundStory) {
            loadContent(foundStory.ref, foundStory.title);
        } else {
            // Fallback to what Gemini provided
            loadContent(ref, title);
        }
    } else if (mode === AppMode.PARABLE) {
        // Try to find the parable in local data
        const foundParable = PARABLES.find(p => p.title.toLowerCase().includes(searchTitle) || searchTitle.includes(p.title.toLowerCase()));
        if (foundParable) {
            loadContent(foundParable.ref, foundParable.title);
        } else {
            // Fallback to what Gemini provided
            loadContent(ref, title);
        }
    } else {
        loadContent(ref, title);
    }
  }, [loadContent, loadSong]);

  const handleReadingCommand = useCallback((command: 'start' | 'stop' | 'enable_auto' | 'disable_auto') => {
    switch (command) {
      case 'start':
        setCurrentVerse((current) => {
            if (current) speak(current.text);
            return current;
        });
        break;
      case 'stop':
        stopSpeaking();
        break;
      case 'enable_auto':
        setAutoRead(true);
        break;
      case 'disable_auto':
        setAutoRead(false);
        break;
    }
  }, [speak, stopSpeaking]);

  const handleTabSwitch = useCallback((mode: AppMode) => {
    setCurrentMode(mode);
    // When switching tabs, clear the specific content to show the "menu" for that tab,
    // unless switching to BIBLE where we might want to keep the last verse or show empty state.
    // For Home/Story/Parable/Song, we want to see the list/dashboard.
    if (mode === AppMode.HOME || mode === AppMode.STORY || mode === AppMode.PARABLE || mode === AppMode.SONG) {
       setCurrentVerse(null);
    }
  }, []);

  const handleConnect = useCallback(() => {
    if (!process.env.API_KEY) {
      console.error("API Key missing");
      setStatus(ConnectionStatus.ERROR);
      return;
    }

    if (!geminiServiceRef.current) {
      geminiServiceRef.current = new GeminiLiveService();
    }

    setStatus(ConnectionStatus.CONNECTING);

    geminiServiceRef.current.connect(
      () => setStatus(ConnectionStatus.CONNECTED),
      handleVerseDetected,
      handleReadingCommand,
      handleTabSwitch,
      handleContentDetected,
      (err) => {
        console.error(err);
        setStatus(ConnectionStatus.ERROR);
      },
      () => setStatus(ConnectionStatus.DISCONNECTED)
    );
  }, [handleVerseDetected, handleReadingCommand, handleTabSwitch, handleContentDetected]);

  const handleDisconnect = useCallback(() => {
    if (geminiServiceRef.current) {
      geminiServiceRef.current.disconnect();
    }
    setStatus(ConnectionStatus.DISCONNECTED);
    stopSpeaking();
  }, [stopSpeaking]);

  useEffect(() => {
    return () => {
      if (geminiServiceRef.current) {
        geminiServiceRef.current.disconnect();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const getBackgroundImage = (mode: AppMode) => {
    switch(mode) {
        case AppMode.HOME: 
            return 'url("https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2673&auto=format&fit=crop")'; // Light/Sanctuary
        case AppMode.BIBLE: 
            return 'url("https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=2574&auto=format&fit=crop")'; // Open Book
        case AppMode.STORY: 
            return 'url("https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2670&auto=format&fit=crop")'; // Mountains/Journey
        case AppMode.PARABLE: 
            return 'url("https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=2670&auto=format&fit=crop")'; // Nature/Wheat
        case AppMode.SONG: 
            return 'url("https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2694&auto=format&fit=crop")'; // Sky/Clouds
        default: 
            return '';
    }
  };

  // Main Render Logic
  const renderAppContent = () => {
    if (!isLoggedIn) {
        return <LoginPage onLoginSuccess={(name) => {
            setChurchName(name);
            setIsLoggedIn(true);
        }} />;
    }

    const renderMainContent = () => {
        // 1. Home Mode
        if (currentMode === AppMode.HOME) {
            return <HomeView churchName={churchName} onNavigate={(mode) => {
                setCurrentMode(mode);
                setCurrentVerse(null);
            }} />;
        }

        // 2. Content Loaded (Verse/Story/Parable/Song specific item)
        if (currentVerse) {
            return <VerseDisplay 
                verse={currentVerse} 
                isLoading={isLoadingVerse} 
                isSpeaking={isSpeaking}
                readingProgress={readingProgress}
                emptyMessage="Waiting for lyrics..."
                subMessage="Try saying 'Show Amazing Grace'"
            />;
        }

        // 3. Library/List Views
        if (currentMode === AppMode.STORY) {
            const items = STORIES.map(s => ({
                title: s.title,
                subtitle: `${s.ref.book} ${s.ref.chapter}`,
                data: s
            }));
            return <ContentList items={items} title="Bible Stories" onSelect={(s) => loadContent(s.ref, s.title)} />;
        }
        if (currentMode === AppMode.PARABLE) {
            const items = PARABLES.map(p => ({
                title: p.title,
                subtitle: `${p.ref.book} ${p.ref.chapter}:${p.ref.verse}`,
                data: p
            }));
            return <ContentList items={items} title="Parables of Jesus" onSelect={(p) => loadContent(p.ref, p.title)} />;
        }
        if (currentMode === AppMode.SONG) {
            const items = SONGS.map(s => ({
                title: s.title,
                subtitle: s.author,
                data: s
            }));
            return <ContentList items={items} title="Hymns & Songs" onSelect={(s) => loadSong(s)} />;
        }

        // 4. Default Bible Mode Empty State
        return (
            <VerseDisplay 
                verse={null} 
                isLoading={isLoadingVerse} 
                isSpeaking={false}
                readingProgress={0}
                emptyMessage="Listening for scripture..."
                subMessage="Try saying 'John 3:16' or 'Show me the Prodigal Son'"
            />
        );
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden relative transition-colors duration-500 bg-slate-900">
        
        {/* Dynamic Background Layer */}
        <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out transform scale-105"
            style={{ backgroundImage: getBackgroundImage(currentMode) }}
        />
        
        {/* Overlay Layer to ensure text readability */}
        <div className="absolute inset-0 bg-slate-50/90 dark:bg-slate-950/85 transition-colors duration-500 backdrop-blur-[2px]" />

        {/* Content Wrapper (Z-index ensure it sits above background) */}
        <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <header className="flex flex-col md:flex-row items-center justify-between p-4 absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-slate-100/90 dark:from-slate-950/90 to-transparent gap-4">
                
                {/* Logo & Church Name */}
                <div className="flex items-center gap-3 self-start md:self-auto">
                    <div className="bg-amber-500/20 p-2 rounded-lg backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-amber-600 dark:text-amber-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-heading font-bold text-lg md:text-xl tracking-wider text-slate-800 dark:text-slate-200 uppercase drop-shadow-sm">
                            {churchName}
                        </h1>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-widest hidden md:block">Live Scripture System</span>
                    </div>
                </div>

                {/* Tab Navigation (Centered) */}
                <TabNavigation 
                    currentMode={currentMode} 
                    onModeChange={(mode) => {
                        setCurrentMode(mode);
                        setCurrentVerse(null);
                    }} 
                />

                {/* Right Side: Time & History */}
                <div className="flex items-center gap-4 self-end md:self-auto">
                    <TimeDisplay />
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-full transition-colors text-slate-700 dark:text-slate-200 backdrop-blur-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative pt-24 md:pt-20 overflow-hidden">
                {renderMainContent()}
            </main>

            {/* Control Bar */}
            <ControlPanel 
                status={status} 
                onConnect={handleConnect} 
                onDisconnect={handleDisconnect} 
                isAudioProcessing={status === ConnectionStatus.CONNECTED}
                autoRead={autoRead}
                toggleAutoRead={() => setAutoRead(!autoRead)}
                isSpeaking={isSpeaking}
                toggleSpeak={() => isSpeaking ? stopSpeaking() : (currentVerse && speak(currentVerse.text))}
                hasVerse={!!currentVerse}
                translation={translation}
                onTranslationChange={setTranslation}
                theme={theme}
                toggleTheme={toggleTheme}
            />
        </div>

        {/* Sidebar */}
        <HistorySidebar 
            history={history} 
            isOpen={isSidebarOpen} 
            toggle={() => setIsSidebarOpen(false)} 
            onSelect={(verse) => {
                setCurrentVerse(verse);
                stopSpeaking();
                setIsSidebarOpen(false);
                if(autoRead) speak(verse.text);
            }}
        />
        
        {/* Overlay Backdrop for Sidebar */}
        {isSidebarOpen && (
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}
        </div>
    );
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
        {renderAppContent()}
    </div>
  );
};

export default App;