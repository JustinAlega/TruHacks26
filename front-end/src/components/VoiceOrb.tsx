interface VoiceOrbProps {
  isListening: boolean;
  isProcessing: boolean;
  sessionStarted: boolean;
  wsConnected: boolean;
  onStartSession: () => void;
  partial: string;
}

export function VoiceOrb({
  isListening,
  isProcessing,
  sessionStarted,
  wsConnected,
  onStartSession,
  partial,
}: VoiceOrbProps) {
  const stateClass = isProcessing
    ? 'processing'
    : isListening
      ? 'listening'
      : sessionStarted
        ? 'idle'
        : 'inactive';

  const statusText = !sessionStarted
    ? 'Click to begin'
    : isProcessing
      ? 'Thinking...'
      : isListening
        ? 'Listening...'
        : 'Ready';

  return (
    <div className="voice-orb-container">
      {partial && (
        <div className="orb-transcript-preview">
          <span>{partial}...</span>
        </div>
      )}

      <button
        className={`voice-orb ${stateClass}`}
        onClick={!sessionStarted ? onStartSession : undefined}
        aria-label={sessionStarted ? statusText : 'Start voice session'}
      >
        <div className="orb-ring ring-1" />
        <div className="orb-ring ring-2" />
        <div className="orb-ring ring-3" />
        <div className="orb-core" />
      </button>

      <div className="orb-status">
        <span className={`orb-dot ${wsConnected ? 'connected' : 'disconnected'}`} />
        <span className="orb-status-text">{statusText}</span>
      </div>
    </div>
  );
}
