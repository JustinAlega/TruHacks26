import { useState, useEffect, useCallback } from 'react';
import {
  isTTSEnabled, setTTSEnabled, isSpeaking as getSpeaking,
  stopSpeaking, onSpeakingChange,
} from '../../services/ttsService';
import './VoiceOrb.css';

interface Props {
  listening?: boolean;
  onToggleListening?: () => void;
  connected?: boolean;
}

export function VoiceOrb({ listening = false, onToggleListening, connected = true }: Props) {
  const [ttsEnabled, setEnabled] = useState(isTTSEnabled);
  const [speaking, setSpeaking] = useState(getSpeaking);

  useEffect(() => {
    onSpeakingChange(setSpeaking);
    return () => onSpeakingChange(() => {});
  }, []);

  const handleClick = useCallback(() => {
    if (listening || onToggleListening) {
      onToggleListening?.();
      return;
    }
    if (speaking) { stopSpeaking(); return; }
    const next = !ttsEnabled;
    setEnabled(next);
    setTTSEnabled(next);
  }, [listening, onToggleListening, speaking, ttsEnabled]);

  const cls = [
    'vorb',
    speaking && 'vorb--speaking',
    listening && 'vorb--listening',
    !connected && 'vorb--off',
  ].filter(Boolean).join(' ');

  const label = !connected ? 'Disconnected'
    : listening ? 'Listening...'
    : speaking ? 'Speaking...'
    : 'Tap to speak';

  return (
    <div className="vorb-wrap">
      <button className={cls} onClick={handleClick} title={label} aria-label={label}>
        <span className="vorb__rings" aria-hidden>
          <span className="vorb__ring" />
          <span className="vorb__ring" />
          <span className="vorb__ring" />
        </span>
        <span className="vorb__glow" aria-hidden />
        <svg className="vorb__icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {listening ? (
            <>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </>
          ) : speaking ? (
            <>
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </>
          ) : (
            <>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </>
          )}
        </svg>
      </button>
      <span className="vorb__label">{label}</span>
      {connected && <span className="vorb__dot vorb__dot--on" aria-hidden />}
    </div>
  );
}
