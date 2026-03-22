import { useState, useRef, useCallback, useEffect } from 'react';
import { useScribe, CommitStrategy } from '@elevenlabs/react';
import { StreamingAudioPlayer } from './audioPlayer';
import { useWidgetManager } from './hooks/useWidgetManager';
import { Widget } from './components/Widget';
import { WidgetDock } from './components/WidgetDock';
import { VoiceOrb } from './components/VoiceOrb';
import { TranscriptPanel } from './components/TranscriptPanel';
import { EXAMPLE_WIDGETS } from './exampleData';
import type { Message, WidgetType, WidgetInstance, Position, Size } from './types';
import { WIDGET_DEFAULT_SIZES } from './types';
import './App.css';

const WS_URL = `ws://${window.location.host}/ws`;

function buildInitialWidgets(): WidgetInstance[] {
  return EXAMPLE_WIDGETS.map((ew, i) => ({
    id: `example-${i}`,
    type: ew.type,
    data: ew.data,
    position: ew.position,
    size: ew.size,
    zIndex: i + 1,
    minimized: false,
  }));
}

declare global {
  interface Window {
    createWidget: (type: WidgetType, data: unknown, position?: Position, size?: Size) => string;
  }
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [partial, setPartial] = useState('');
  const [assistantBuffer, setAssistantBuffer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<StreamingAudioPlayer | null>(null);

  if (!playerRef.current) {
    playerRef.current = new StreamingAudioPlayer();
  }

  const {
    widgets,
    addWidget,
    removeWidget,
    updatePosition,
    bringToFront,
    toggleMinimize,
  } = useWidgetManager(buildInitialWidgets());

  const addWidgetRef = useRef(addWidget);

  // Keep ref in sync so WebSocket handler always has latest addWidget
  addWidgetRef.current = addWidget;

  // Expose createWidget on window for external (WebSocket/AI) invocation
  useEffect(() => {
    window.createWidget = (type: WidgetType, data: unknown, position?: Position, size?: Size) => {
      return addWidget(type, data, position, size ?? WIDGET_DEFAULT_SIZES[type]);
    };
    return () => {
      delete (window as Record<string, unknown>).createWidget;
    };
  }, [addWidget]);

  // WebSocket to backend
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connect, 2000);
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (msg.type) {
          case 'text':
            setAssistantBuffer((prev) => prev + msg.data);
            break;
          case 'audio':
            playerRef.current!.playChunk(msg.data);
            break;
          case 'tool_call':
            setAssistantBuffer(
              (prev) => prev + `\n[Calling ${msg.name}...]\n`,
            );
            break;
          case 'tool_result':
            setMessages((prev) => [
              ...prev,
              { role: 'tool', name: msg.name, data: msg.data },
            ]);
            break;
          case 'widget':
            console.log('[WIDGET] Received widget message:', msg.widget_type, msg.data);
            addWidgetRef.current(msg.widget_type, msg.data, msg.position, msg.size);
            break;
          case 'done':
            setAssistantBuffer((prev) => {
              if (prev.trim()) {
                setMessages((msgs) => [
                  ...msgs,
                  { role: 'assistant', text: prev },
                ]);
              }
              return '';
            });
            setIsProcessing(false);
            break;
        }
      };
    };

    connect();
    return () => wsRef.current?.close();
  }, []);

  // ElevenLabs STT
  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      setPartial(data.text);
    },
    onCommittedTranscript: (data) => {
      const text = data.text.trim();
      if (!text) return;

      setPartial('');
      setMessages((prev) => [...prev, { role: 'user', text }]);
      playerRef.current!.reset();

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        setIsProcessing(true);
        setAssistantBuffer('');
        wsRef.current.send(JSON.stringify({ type: 'transcript', text }));
      }
    },
  });

  const isListening =
    scribe.status === 'connected' || scribe.status === 'transcribing';

  const startSession = useCallback(async () => {
    playerRef.current!.init();

    try {
      const resp = await fetch('/scribe-token');
      const tokenData = await resp.json();
      await scribe.connect({
        token: tokenData.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setSessionStarted(true);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  }, [scribe]);

  const visibleWidgets = widgets.filter((w) => !w.minimized);
  const minimizedWidgets = widgets.filter((w) => w.minimized);

  return (
    <div className="hud-canvas">
      <div className="canvas-grid" />

      <header className="hud-header">
        <h1 className="hud-title">Aria</h1>
        <span className="hud-subtitle">Academic Intelligence</span>
      </header>

      <div className="widget-layer">
        {visibleWidgets.map((w) => (
          <Widget
            key={w.id}
            widget={w}
            onClose={removeWidget}
            onMinimize={toggleMinimize}
            onPositionChange={updatePosition}
            onBringToFront={bringToFront}
          />
        ))}
      </div>

      <WidgetDock
        minimizedWidgets={minimizedWidgets}
        onRestore={toggleMinimize}
        onClose={removeWidget}
      />

      <VoiceOrb
        isListening={isListening}
        isProcessing={isProcessing}
        sessionStarted={sessionStarted}
        wsConnected={wsConnected}
        onStartSession={startSession}
        partial={partial}
      />

      <TranscriptPanel
        messages={messages}
        assistantBuffer={assistantBuffer}
        isOpen={transcriptOpen}
        onToggle={() => setTranscriptOpen((o) => !o)}
      />
    </div>
  );
}

export default App;
