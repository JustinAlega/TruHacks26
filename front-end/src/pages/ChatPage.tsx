import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import { useWidgetWindowStore } from '../stores/widgetWindowStore';
import { AppLayout } from '../components/layout/AppLayout';
import { TranscriptOverlay } from '../components/transcript/TranscriptOverlay';
import { VoiceOrb } from '../components/voice/VoiceOrb';
import { WidgetCanvas } from '../components/widgets/WidgetCanvas';
import { WidgetDock } from '../components/widgets/WidgetDock';
import { createMockWSService } from '../services/mockWsService';
import { speak } from '../services/ttsService';
import type { WSService } from '../services/wsService';
import './ChatPage.css';

export function ChatPage() {
  const nav = useNavigate();
  const ctx = useChatStore((s) => s.studentContext);
  const addMsg = useChatStore((s) => s.addMessage);
  const append = useChatStore((s) => s.appendToMessage);
  const setStream = useChatStore((s) => s.setStreaming);
  const pushTranscript = useChatStore((s) => s.pushTranscript);
  const appendTranscript = useChatStore((s) => s.appendTranscript);
  const applyActions = useWidgetWindowStore((s) => s.applyActions);

  const wsRef = useRef<WSService | null>(null);
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    if (!ctx) { nav('/', { replace: true }); return; }

    const ws = createMockWSService();
    wsRef.current = ws;

    ws.onChunk = (id, chunk) => {
      const msgs = useChatStore.getState().messages;
      if (!msgs.find((m) => m.id === id)) {
        setStream(true);
        addMsg({ id, role: 'assistant', text: chunk, timestamp: Date.now() });
        pushTranscript({ id, role: 'assistant', text: chunk, timestamp: Date.now() });
      } else {
        append(id, chunk);
        appendTranscript(id, chunk);
      }
    };

    ws.onWidget = (actions) => {
      applyActions(actions);
    };

    ws.onComplete = (res) => {
      setStream(false);
      if (res.text) {
        void speak(res.text);
      }
    };

    ws.onError = (err) => { console.error('WS:', err); setStream(false); };
    ws.connect(ctx);

    return () => { ws.disconnect(); wsRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = useCallback((text: string) => {
    if (!wsRef.current || !ctx) return;
    const id = crypto.randomUUID();
    addMsg({ id, role: 'user', text, timestamp: Date.now() });
    pushTranscript({ id, role: 'user', text, timestamp: Date.now() });
    wsRef.current.send({ text, studentContext: ctx });
  }, [ctx, addMsg, pushTranscript]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    send(text);
    setInputText('');
  }, [inputText, send]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !showInput && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setShowInput(true);
      }
      if (e.key === 'Escape' && showInput) {
        setShowInput(false);
        setInputText('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showInput]);

  return (
    <>
      <AppLayout>
        {null}
      </AppLayout>

      <WidgetCanvas />
      <WidgetDock />
      <TranscriptOverlay />

      {showInput && (
        <form className="chat-input-bar" onSubmit={handleSubmit}>
          <input
            className="chat-input-bar__field"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            autoFocus
          />
          <button className="chat-input-bar__send" type="submit" disabled={!inputText.trim()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      )}

      {!showInput && (
        <div className="chat-hint">
          Press <kbd>/</kbd> to type
        </div>
      )}

      <VoiceOrb connected />
    </>
  );
}
