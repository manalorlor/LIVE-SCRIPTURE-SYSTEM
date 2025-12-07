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
  
  // Reading (TTS) State
  const [autoRead, setAutoRead] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const geminiServiceRef = useRef<GeminiLiveService | null>(null);
  const loadContentRequestId = useRef(0);

  // Text-to-Speech Helper Functions
  const speak = useCallback((text: string) => {
    // Ensure we stop any previous Gemini audio before starting TTS
    geminiServiceRef.current?.interrupt();
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    // Also stop Gemini singing/audio
    geminiServiceRef.current?.interrupt();
  }, []);

  // Generic Verse Fetcher
  const loadContent = useCallback(async (ref: ScriptureReference, title?: string) => {
    const requestId = ++loadContentRequestId.current;
    setIsLoadingVerse(true);
    
    try {
      const verse = await fetchVerse(ref, title);
      
      // If a newer request has started, ignore this result
      if (requestId !== loadContentRequestId.current) return;
  
      setIsLoadingVerse(false);
      
      if (verse) {
        setCurrentVerse(verse);
        setHistory(prev => [verse, ...prev]);
        if (autoRead) speak(verse.text);
      }
    } catch (e) {
      if (requestId === loadContentRequestId.current) {
         setIsLoadingVerse(false);
      }
      console.error("Failed to load content", e);
    }
  }, [autoRead, speak]);

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

  // Main Render Logic
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
            emptyMessage="Listening for scripture..."
            subMessage="Try saying 'John 3:16' or 'Show me the Prodigal Son'"
        />
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between p-4 absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-slate-950/90 to-transparent gap-4">
        
        {/* Logo & Church Name */}
        <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="bg-amber-500/20 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-amber-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
            </div>
            <div className="flex flex-col">
                <h1 className="font-heading font-bold text-lg md:text-xl tracking-wider text-slate-200 uppercase">
                    {churchName}
                </h1>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest hidden md:block">Live Scripture System</span>
            </div>
        </div>

        {/* Tab Navigation (Centered) */}
        <TabNavigation 
            currentMode={currentMode} 
            onModeChange={(mode) => {
                setCurrentMode(mode);
                // When clicking tabs, usually reset view to list/home unless in Bible mode (maybe keep verse?)
                // For consistency, let's reset to "Main view of that tab"
                setCurrentVerse(null);
            }} 
        />

        {/* Right Side: Time & History */}
        <div className="flex items-center gap-4 self-end md:self-auto">
            <TimeDisplay />
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
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

      {/* Control Bar (Only show if logged in and not on Login page - handled by return earlier) */}
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
      />

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

export default App;