import { useState, useRef, useCallback, useEffect } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { StreamingAudioPlayer } from "./audioPlayer";
import "./App.css";

type Message =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string }
  | { role: "tool"; name: string; data: unknown };

const WS_URL = `ws://${window.location.host}/ws`;

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [partial, setPartial] = useState("");
  const [assistantBuffer, setAssistantBuffer] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<StreamingAudioPlayer | null>(null);

  if (!playerRef.current) {
    playerRef.current = new StreamingAudioPlayer();
  }

  // ── WebSocket to backend ──────────────────────────────────────────

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
          console.warn("Invalid JSON from server:", event.data);
          return;
        }

        switch (msg.type) {
          case "text":
            setAssistantBuffer((prev) => prev + msg.data);
            break;
          case "audio":
            playerRef.current!.playChunk(msg.data);
            break;
          case "tool_call":
            setAssistantBuffer(
              (prev) => prev + `\n[Calling ${msg.name}...]\n`
            );
            break;
          case "tool_result":
            setMessages((prev) => [
              ...prev,
              { role: "tool", name: msg.name, data: msg.data },
            ]);
            break;
          case "done":
            setAssistantBuffer((prev) => {
              if (prev.trim()) {
                setMessages((msgs) => [
                  ...msgs,
                  { role: "assistant", text: prev },
                ]);
              }
              return "";
            });
            setIsProcessing(false);
            break;
        }
      };
    };

    connect();
    return () => wsRef.current?.close();
  }, []);

  // ── ElevenLabs STT (client-side) ─────────────────────────────────

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      setPartial(data.text);
    },
    onCommittedTranscript: (data) => {
      const text = data.text.trim();
      if (!text) return;

      setPartial("");
      setMessages((prev) => [...prev, { role: "user", text }]);

      // Stop any playing audio (user interrupted)
      playerRef.current!.reset();

      // Send to backend
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        setIsProcessing(true);
        setAssistantBuffer("");
        wsRef.current.send(JSON.stringify({ type: "transcript", text }));
      }
    },
  });

  const isListening =
    scribe.status === "connected" || scribe.status === "transcribing";

  // ── Push-to-talk ──────────────────────────────────────────────────

  const toggleListening = useCallback(async () => {
    // Init audio player on user gesture to satisfy autoplay policy
    playerRef.current!.init();

    if (isListening) {
      scribe.disconnect();
    } else {
      try {
        const resp = await fetch("/scribe-token");
        const tokenData = await resp.json();
        await scribe.connect({
          token: tokenData.token,
          microphone: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err) {
        console.error("Failed to connect STT:", err);
      }
    }
  }, [isListening, scribe]);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="app">
      <header>
        <h1>Aria</h1>
        <p className="subtitle">AI Academic &amp; Career Advisor</p>
        <div className="status">
          <span className={`dot ${wsConnected ? "green" : "red"}`} />
          {wsConnected ? "Connected" : "Disconnected"}
        </div>
      </header>

      <div className="messages">
        {messages.map((msg, i) => {
          if (msg.role === "tool") {
            return (
              <div key={i} className="message tool">
                <strong>{msg.name}</strong>
                <pre>{JSON.stringify(msg.data, null, 2)}</pre>
              </div>
            );
          }
          return (
            <div key={i} className={`message ${msg.role}`}>
              <span className="label">
                {msg.role === "user" ? "You" : "Aria"}
              </span>
              <p>{msg.text}</p>
            </div>
          );
        })}

        {assistantBuffer && (
          <div className="message assistant streaming">
            <span className="label">Aria</span>
            <p>{assistantBuffer}</p>
          </div>
        )}

        {partial && (
          <div className="message user partial">
            <span className="label">You</span>
            <p>{partial}...</p>
          </div>
        )}
      </div>

      <div className="controls">
        <button
          className={`mic-button ${isListening ? "listening" : ""}`}
          onClick={toggleListening}
        >
          {isListening ? "Listening..." : "Push to Talk"}
        </button>
        {isProcessing && <span className="processing">Thinking...</span>}
      </div>
    </div>
  );
}

export default App;
