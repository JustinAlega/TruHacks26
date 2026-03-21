import type { WSService, OnChunkCb, OnCompleteCb, OnWidgetCb, OnErrorCb } from './wsService';
import type { StudentContext, UserMessage } from '../types';
import { StreamingAudioPlayer } from '../audioPlayer';

/**
 * Real WebSocket service connecting to the FastAPI backend.
 * Skeleton for future integration — currently mirrors the mock interface.
 *
 * Backend protocol:
 *   { type: "text",        data: string }        — streamed text chunk
 *   { type: "audio",       data: string }        — base64 mp3 chunk
 *   { type: "tool_call",   name, args }          — tool invocation notification
 *   { type: "tool_result", name, data }          — tool result
 *   { type: "widget",      action, id, widget_type, data } — widget action
 *   { type: "done" }                             — end of response
 */

const WS_URL = `ws://${window.location.host}/ws`;

export function createRealWSService(): WSService {
  let ws: WebSocket | null = null;
  let player: StreamingAudioPlayer | null = null;
  let currentMsgId = '';

  const svc: WSService = {
    onChunk: null,
    onComplete: null,
    onWidget: null,
    onError: null,

    connect(_ctx: StudentContext) {
      player = new StreamingAudioPlayer();
      player.init();

      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[realWS] connected');
      };

      ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); }
        catch { return; }

        switch (msg.type) {
          case 'text':
            if (!currentMsgId) {
              currentMsgId = crypto.randomUUID();
            }
            svc.onChunk?.(currentMsgId, msg.data);
            break;

          case 'audio':
            player?.playChunk(msg.data);
            break;

          case 'widget':
            svc.onWidget?.([{
              action: msg.action ?? 'show',
              id: msg.id,
              type: msg.widget_type,
              data: msg.data ?? {},
            }]);
            break;

          case 'done': {
            const id = currentMsgId || crypto.randomUUID();
            currentMsgId = '';
            svc.onComplete?.({ id, text: '' });
            break;
          }
        }
      };

      ws.onclose = () => {
        console.log('[realWS] disconnected');
      };

      ws.onerror = () => {
        svc.onError?.(new Error('WebSocket error'));
      };
    },

    disconnect() {
      ws?.close();
      ws = null;
      player?.stop();
      player = null;
    },

    send(msg: UserMessage) {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        svc.onError?.(new Error('Not connected'));
        return;
      }
      player?.reset();
      currentMsgId = '';
      ws.send(JSON.stringify({ type: 'transcript', text: msg.text }));
    },
  };

  return svc;
}
