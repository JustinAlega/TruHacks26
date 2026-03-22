import { useMemo } from 'react';

interface VoiceOrbProps {
  isListening: boolean;
  isProcessing: boolean;
  sessionStarted: boolean;
  wsConnected: boolean;
  onStartSession: () => void;
  partial: string;
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

interface ArcRing {
  radius: number;
  width: number;
  segments: { start: number; end: number }[];
  className: string;
  opacity: number;
}

const ARC_RINGS: ArcRing[] = [
  {
    radius: 38, width: 2.5, opacity: 0.7,
    className: 'arc-ring-1',
    segments: [
      { start: 0, end: 90 },
      { start: 120, end: 210 },
      { start: 240, end: 330 },
    ],
  },
  {
    radius: 44, width: 1.5, opacity: 0.5,
    className: 'arc-ring-2',
    segments: [
      { start: 10, end: 70 },
      { start: 100, end: 170 },
      { start: 200, end: 280 },
      { start: 310, end: 350 },
    ],
  },
  {
    radius: 50, width: 2, opacity: 0.35,
    className: 'arc-ring-3',
    segments: [
      { start: 30, end: 150 },
      { start: 190, end: 310 },
    ],
  },
  {
    radius: 56, width: 1, opacity: 0.2,
    className: 'arc-ring-4',
    segments: [
      { start: 0, end: 60 },
      { start: 90, end: 140 },
      { start: 180, end: 260 },
      { start: 290, end: 350 },
    ],
  },
];

const CX = 64;
const CY = 64;

export function VoiceOrb({
  isListening,
  isProcessing,
  sessionStarted,
  wsConnected,
  onStartSession,
  partial,
  isReconnecting,
}: VoiceOrbProps) {
  const stateClass = isReconnecting
    ? 'idle'
    : isProcessing
      ? 'processing'
      : isListening
        ? 'listening'
        : sessionStarted
          ? 'idle'
          : 'inactive';

  const statusText = !sessionStarted
    ? 'Click to initialize'
    : isProcessing
      ? 'Processing...'
      : isListening
        ? 'Listening...'
        : 'Standing by';

  const arcElements = useMemo(
    () =>
      ARC_RINGS.map((ring) => (
        <g key={ring.className} className={ring.className} opacity={ring.opacity}>
          {ring.segments.map((seg, i) => (
            <path
              key={i}
              d={arcPath(CX, CY, ring.radius, seg.start, seg.end)}
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth={ring.width}
              strokeLinecap="round"
            />
          ))}
        </g>
      )),
    [],
  );

  return (
    <div className="voice-orb-container">
      {partial && (
        <div className="orb-transcript-preview">
          <span>{partial}...</span>
        </div>
      )}

      <button
        className={`voice-orb ${stateClass}`}
        onClick={onStartSession}
        aria-label={sessionStarted ? statusText : 'Start voice session'}
      >
        <svg
          className="orb-arcs"
          viewBox="0 0 128 128"
          width="128"
          height="128"
        >
          <defs>
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--secondary-fixed)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--secondary-fixed)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--secondary-fixed)" />
              <stop offset="100%" stopColor="var(--secondary-fixed-dim)" />
            </linearGradient>
          </defs>

          <circle cx={CX} cy={CY} r="30" fill="url(#coreGlow)" className="orb-glow-circle" />

          {arcElements}

          {/* Tick marks on outermost ring */}
          <g className="arc-ticks" opacity="0.15">
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = i * 10;
              const rad = (angle * Math.PI) / 180;
              const r1 = 60;
              const r2 = 62;
              return (
                <line
                  key={i}
                  x1={CX + r1 * Math.cos(rad)}
                  y1={CY + r1 * Math.sin(rad)}
                  x2={CX + r2 * Math.cos(rad)}
                  y2={CY + r2 * Math.sin(rad)}
                  stroke="var(--secondary-fixed)"
                  strokeWidth="0.8"
                />
              );
            })}
          </g>
        </svg>

        <div className="orb-core">
          <div className="orb-core-inner" />
        </div>
      </button>

      <div className="orb-status">
        <span className={`orb-dot ${wsConnected ? 'connected' : 'disconnected'}`} />
        <span className="orb-status-text">{statusText}</span>
      </div>
    </div>
  );
}
