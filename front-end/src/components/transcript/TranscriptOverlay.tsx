import { useChatStore } from '../../stores/chatStore';
import './TranscriptOverlay.css';

export function TranscriptOverlay() {
  const transcript = useChatStore((s) => s.transcript);
  const isStreaming = useChatStore((s) => s.isStreaming);

  if (transcript.length === 0) return null;

  return (
    <div className="transcript" role="log" aria-label="Conversation transcript" aria-live="polite">
      <div className="transcript__inner">
        {transcript.map((entry) => (
          <div
            key={entry.id}
            className={`transcript__line transcript__line--${entry.role}${entry.fading ? ' transcript__line--fade' : ''}`}
          >
            <span className="transcript__role">
              {entry.role === 'user' ? 'You' : 'Aria'}
            </span>
            <span className="transcript__text">
              {entry.text}
              {entry.role === 'assistant' && isStreaming && entry.id === transcript[transcript.length - 1]?.id && (
                <span className="transcript__cursor" aria-hidden />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
