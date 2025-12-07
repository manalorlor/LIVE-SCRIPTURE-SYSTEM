import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, Blob } from '@google/genai';
import { ScriptureReference, AppMode } from '../types';

// Define tools
const revealScriptureTool: FunctionDeclaration = {
  name: 'revealScripture',
  description: 'Display a specific Bible verse or whole chapter.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      book: { type: Type.STRING },
      chapter: { type: Type.INTEGER },
      verse: { type: Type.STRING },
    },
    required: ['book', 'chapter'],
  },
};

const controlReadingTool: FunctionDeclaration = {
  name: 'controlReading',
  description: 'Control text-to-speech reading.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: {
        type: Type.STRING,
        enum: ['start', 'stop', 'enable_auto', 'disable_auto']
      },
    },
    required: ['command'],
  },
};

const switchTabTool: FunctionDeclaration = {
  name: 'switchTab',
  description: 'Switch the app view mode between Home, Bible (Verses), Stories, Parables, and Songs.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      mode: {
        type: Type.STRING,
        enum: ['home', 'bible', 'story', 'parable', 'song'],
        description: 'The mode to switch to.',
      },
    },
    required: ['mode'],
  },
};

const displayNamedContentTool: FunctionDeclaration = {
  name: 'displayNamedContent',
  description: 'Display named content like a Bible Story, Parable, or Song.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Title of the story, parable, or song' },
      book: { type: Type.STRING, description: 'Bible book (Required for story/parable)' },
      chapter: { type: Type.INTEGER, description: 'Bible chapter (Required for story/parable)' },
      verse: { type: Type.STRING, description: 'Bible verse range (Optional)' },
      mode: { type: Type.STRING, enum: ['story', 'parable', 'song'] },
    },
    required: ['title', 'mode'],
  },
};

export class GeminiLiveService {
  private ai: GoogleGenAI | null = null;
  private sessionPromise: Promise<any> | null = null;
  
  // Input Audio (Mic)
  private inputAudioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;

  // Output Audio (Speaker)
  private outputAudioContext: AudioContext | null = null;
  private outputNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private scheduledSources: AudioBufferSourceNode[] = [];
  
  private isConnected: boolean = false;

  constructor() {
    // Initialized in connect()
  }

  async connect(
    onOpen: () => void,
    onVerseDetected: (ref: ScriptureReference) => void,
    onReadingCommand: (command: 'start' | 'stop' | 'enable_auto' | 'disable_auto') => void,
    onTabSwitch: (mode: AppMode) => void,
    onContentDetected: (title: string, ref: ScriptureReference, mode: AppMode) => void,
    onError: (error: Error) => void,
    onClose: () => void
  ) {
    try {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      this.isConnected = true;

      // Initialize Input Context
      // Attempt to ask for 16kHz, but the browser might provide the native hardware rate.
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      // Resume context if suspended (must be done after user gesture, which calls connect)
      if (this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
      }

      // Initialize Output Context (Gemini usually returns 24kHz)
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);
      
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            if (this.isConnected) {
              onOpen();
              this.startAudioStream();
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!this.isConnected) return;

            // Handle Tools
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                const args = fc.args as any;
                
                if (fc.name === 'revealScripture') {
                  const ref: ScriptureReference = {
                    book: args.book,
                    chapter: args.chapter,
                    verse: args.verse ? String(args.verse) : undefined,
                  };
                  onVerseDetected(ref);
                  this.sendToolResponse(fc.id, fc.name, { result: "Displayed." });

                } else if (fc.name === 'controlReading') {
                  onReadingCommand(args.command);
                  this.sendToolResponse(fc.id, fc.name, { result: "Executed." });

                } else if (fc.name === 'switchTab') {
                  onTabSwitch(args.mode as AppMode);
                  this.sendToolResponse(fc.id, fc.name, { result: `Switched to ${args.mode}.` });

                } else if (fc.name === 'displayNamedContent') {
                   const ref: ScriptureReference = {
                    book: args.book || '',
                    chapter: args.chapter || 0,
                    verse: args.verse ? String(args.verse) : undefined,
                  };
                  onContentDetected(args.title, ref, args.mode as AppMode);
                  this.sendToolResponse(fc.id, fc.name, { result: `Displayed ${args.title}.` });
                }
              }
            }

            // Handle Audio Output
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
                const audioData = message.serverContent.modelTurn.parts[0].inlineData.data;
                this.queueAudio(audioData);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
                this.interrupt();
            }
          },
          onerror: (e: any) => {
             console.error("Gemini Live API Error Details:", e);
             if (this.isConnected) {
                 const msg = e instanceof Error ? e.message : (e.message || JSON.stringify(e));
                 onError(new Error(`Gemini Live Error: ${msg}`));
                 this.disconnect();
             }
          },
          onclose: (e: CloseEvent) => {
            if (this.isConnected) {
                onClose();
                this.disconnect();
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          tools: [{ functionDeclarations: [revealScriptureTool, controlReadingTool, switchTabTool, displayNamedContentTool] }],
          systemInstruction: `
            You are a church service assistant. Listen for Bible references, songs, and commands.
            
            1. **Songs / Hymns**:
               - If the user asks for a song (e.g., "Sing Amazing Grace", "Show Holy Holy Holy"), call the 'displayNamedContent' tool with mode='song'.
               - CRITICAL: IMMEDIATELY after calling the tool, START SINGING the first verse and chorus of the song.
               - Sing with a clear, melodic, female voice. Do not just speak the lyrics, sing them rhythmically.
            
            2. **Verses, Stories, Parables**: 
               - Call the appropriate tool ('revealScripture', 'displayNamedContent').
               - REMAIN SILENT. Do not read the text aloud. Do not say "Here is the verse". Just trigger the tool.
            
            3. **Navigation**:
               - Handle "Go Home", "Show Bible", etc. using 'switchTab'.
               - Remain silent.
               
            4. **Reading Control**:
               - If user says "Read it", call 'controlReading' with 'start'.
               - If user says "Stop", call 'controlReading' with 'stop'.
               - Remain silent.
          `,
        },
      };

      this.sessionPromise = this.ai!.live.connect(config);
      // Catch initial connection rejections to prevent unhandled rejection errors
      // Real errors are handled in callbacks.onerror
      this.sessionPromise.catch(() => {});

    } catch (err) {
      this.disconnect(); // Ensure cleanup if initialization fails
      onError(err instanceof Error ? err : new Error('Unknown connection error'));
    }
  }

  public interrupt() {
    // Stop all currently scheduled audio sources
    this.scheduledSources.forEach(source => {
        try {
            source.stop();
        } catch (e) {
            // ignore
        }
    });
    this.scheduledSources = [];
    
    // Reset time tracking
    if (this.outputAudioContext) {
        this.nextStartTime = this.outputAudioContext.currentTime;
    }
  }

  private async queueAudio(base64Data: string) {
    if (!this.outputAudioContext || !this.outputNode) return;

    try {
        const audioBuffer = await this.decodeAudioData(base64Data);
        
        // Ensure we schedule in the future
        this.nextStartTime = Math.max(this.outputAudioContext.currentTime, this.nextStartTime);
        
        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputNode);
        source.start(this.nextStartTime);
        
        this.scheduledSources.push(source);
        
        // Cleanup when done
        source.onended = () => {
            this.scheduledSources = this.scheduledSources.filter(s => s !== source);
        };
        
        // Advance cursor
        this.nextStartTime += audioBuffer.duration;
    } catch (error) {
        console.warn("Failed to decode audio chunk", error);
    }
  }

  private async decodeAudioData(base64Data: string): Promise<AudioBuffer> {
    if (!this.outputAudioContext) throw new Error("Audio Context not initialized");

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // PCM 16-bit to Float32
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
    }

    const buffer = this.outputAudioContext.createBuffer(1, float32Data.length, 24000);
    buffer.copyToChannel(float32Data, 0);
    return buffer;
  }

  private sendToolResponse(id: string, name: string, response: any) {
    if (this.sessionPromise && this.isConnected) {
      // Use IIFE async wrapper to avoid chaining .catch directly on promise properties
      (async () => {
        try {
          const session = await this.sessionPromise;
          // sendToolResponse might return a promise or void. Handle robustly.
          const result = session.sendToolResponse({
            functionResponses: {
              id: id,
              name: name,
              response: response,
            }
          });
          // Check if result is a promise before awaiting or catching
          if (result && typeof (result as any).catch === 'function') {
            await result;
          }
        } catch (e) {
          console.warn("Failed to send tool response", e);
        }
      })();
    }
  }

  private startAudioStream() {
    if (!this.inputAudioContext || !this.stream || !this.sessionPromise) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
      if (!this.isConnected) return;
      
      const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
      // Use the actual sample rate from the context to avoid tokenizer mismatch
      const sampleRate = this.inputAudioContext?.sampleRate || 16000;
      const pcmBlob = this.createBlob(inputData, sampleRate);
      
      this.sessionPromise?.then((session) => {
        if (this.isConnected) {
           try {
             // Safe handling of sendRealtimeInput return value
             const result = session.sendRealtimeInput({ media: pcmBlob });
             if (result && typeof (result as any).catch === 'function') {
                 (result as any).catch((e: any) => {
                     // Silently ignore async sending errors to avoid unhandled rejection logs
                 });
             }
           } catch (e) {
             if(this.isConnected) console.warn("sendRealtimeInput failed", e);
           }
        }
      });
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioContext.destination);
  }

  async disconnect() {
    this.isConnected = false;
    this.interrupt();
    
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null; // Prevent further events
      this.scriptProcessor = null;
    }
    
    if (this.sessionPromise) {
        try {
            // Await safely without chaining .catch directly
            const session = await this.sessionPromise;
            session.close();
        } catch(e) { 
            // Ignore errors during closing
        }
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
        this.outputAudioContext.close();
        this.outputAudioContext = null;
    }
    this.sessionPromise = null;
    this.ai = null;
  }

  private createBlob(data: Float32Array, sampleRate: number): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      let s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
      data: this.encode(new Uint8Array(int16.buffer)),
      mimeType: `audio/pcm;rate=${sampleRate}`, // Dynamically set rate to match context
    };
  }

  private encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}