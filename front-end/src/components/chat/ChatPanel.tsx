import { useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import './ChatPanel.css';

export function ChatPanel({ onSend }: { onSend: (text: string) => void }) {
  const messages = useChatStore((s) => s.messages);
  const streaming = useChatStore((s) => s.isStreaming);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat">
      <header className="chat__header">
        <div className="chat__header-orb" aria-hidden />
        <div>
          <h1 className="chat__header-title">Academic Advisor</h1>
          <p className="chat__header-sub">Career & course guidance</p>
        </div>
      </header>

      <div className="chat__scroll">
        {messages.length === 0 ? (
          <div className="chat__empty">
            <div className="chat__empty-orb" />
            <h2 className="chat__empty-title">Start the conversation</h2>
            <p className="chat__empty-body">
              Ask about assignments, courses, internships, or your skill progress.
              Insight panels will appear as draggable glass windows you can move anywhere.
            </p>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
        <div ref={endRef} />
      </div>

      <ChatInput onSend={onSend} disabled={streaming} />
    </div>
  );
}
