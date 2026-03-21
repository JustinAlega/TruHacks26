import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import './ChatInput.css';

export function ChatInput({ onSend, disabled }: { onSend: (t: string) => void; disabled?: boolean }) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  const send = useCallback(() => {
    const v = text.trim();
    if (!v || disabled) return;
    onSend(v);
    setText('');
    if (ref.current) ref.current.style.height = 'auto';
  }, [text, disabled, onSend]);

  const onKey = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }, [send]);

  const resize = useCallback(() => {
    const el = ref.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }
  }, []);

  return (
    <div className="ci">
      <div className="ci__wrap">
        <textarea
          ref={ref}
          className="ci__field"
          placeholder="Ask your advisor anything…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          onInput={resize}
          rows={1}
          disabled={disabled}
          aria-label="Message"
        />
        {/* §5 Primary Button — gradient, md radius */}
        <button className="ci__send" onClick={send} disabled={disabled || !text.trim()} title="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
