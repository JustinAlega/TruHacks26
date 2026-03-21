import { create } from 'zustand';
import type { ChatMessage, StudentContext } from '../types';

export interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  fading?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  studentContext: StudentContext | null;
  isStreaming: boolean;
  transcript: TranscriptEntry[];

  setStudentContext: (ctx: StudentContext) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  appendToMessage: (id: string, chunk: string) => void;
  setStreaming: (v: boolean) => void;
  clearMessages: () => void;

  pushTranscript: (entry: TranscriptEntry) => void;
  appendTranscript: (id: string, chunk: string) => void;
  fadeTranscript: (id: string) => void;
  clearTranscript: () => void;
}

const MAX_TRANSCRIPT = 6;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  studentContext: null,
  isStreaming: false,
  transcript: [],

  setStudentContext: (ctx) => set({ studentContext: ctx }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  updateMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  appendToMessage: (id, chunk) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, text: m.text + chunk } : m,
      ),
    })),

  setStreaming: (v) => set({ isStreaming: v }),
  clearMessages: () => set({ messages: [] }),

  pushTranscript: (entry) =>
    set((s) => ({
      transcript: [...s.transcript, entry].slice(-MAX_TRANSCRIPT),
    })),

  appendTranscript: (id, chunk) =>
    set((s) => ({
      transcript: s.transcript.map((t) =>
        t.id === id ? { ...t, text: t.text + chunk } : t,
      ),
    })),

  fadeTranscript: (id) =>
    set((s) => ({
      transcript: s.transcript.map((t) =>
        t.id === id ? { ...t, fading: true } : t,
      ),
    })),

  clearTranscript: () => set({ transcript: [] }),
}));
