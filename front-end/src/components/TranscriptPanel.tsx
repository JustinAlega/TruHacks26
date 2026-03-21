import type { Message } from '../types';

interface TranscriptPanelProps {
  messages: Message[];
  assistantBuffer: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function TranscriptPanel({
  messages,
  assistantBuffer,
  isOpen,
  onToggle,
}: TranscriptPanelProps) {
  return (
    <>
      <button
        className={`transcript-toggle ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        aria-label={isOpen ? 'Close transcript' : 'Open transcript'}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M3 4h12M3 9h12M3 14h8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className={`transcript-panel ${isOpen ? 'open' : ''}`}>
        <div className="transcript-header">
          <h3>Conversation</h3>
          <button className="transcript-close" onClick={onToggle} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <line x1="3" y1="3" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" />
              <line x1="11" y1="3" x2="3" y2="11" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        <div className="transcript-messages">
          {messages.map((msg, i) => {
            if (msg.role === 'tool') {
              return (
                <div key={i} className="transcript-msg tool">
                  <span className="transcript-label">{msg.name}</span>
                  <pre>{JSON.stringify(msg.data, null, 2)}</pre>
                </div>
              );
            }
            return (
              <div key={i} className={`transcript-msg ${msg.role}`}>
                <span className="transcript-label">
                  {msg.role === 'user' ? 'You' : 'Aria'}
                </span>
                <p>{msg.text}</p>
              </div>
            );
          })}

          {assistantBuffer && (
            <div className="transcript-msg assistant streaming">
              <span className="transcript-label">Aria</span>
              <p>{assistantBuffer}</p>
            </div>
          )}

          {messages.length === 0 && !assistantBuffer && (
            <div className="transcript-empty">
              Start talking to Aria to see the conversation here.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
