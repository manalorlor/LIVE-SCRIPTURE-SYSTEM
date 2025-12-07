export interface Verse {
  reference: string;
  text: string;
  translation_id?: string;
  translation_name?: string;
  translation_note?: string;
  book_name?: string;
  chapter?: number;
  verse?: number;
  title?: string; // For stories/parables e.g., "The Good Samaritan"
}

export interface ScriptureReference {
  book: string;
  chapter: number;
  verse?: string; // Optional: if undefined, implies whole chapter
}

export enum AppMode {
  HOME = 'home',
  BIBLE = 'bible',
  STORY = 'story',
  PARABLE = 'parable',
  SONG = 'song',
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

export interface LogMessage {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'verse' | 'error';
}