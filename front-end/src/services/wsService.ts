import type { AIResponse, StudentContext, UserMessage, WidgetAction } from '../types';

export type OnChunkCb = (messageId: string, chunk: string) => void;
export type OnCompleteCb = (response: AIResponse) => void;
export type OnWidgetCb = (actions: WidgetAction[]) => void;
export type OnErrorCb = (error: Error) => void;

export interface WSService {
  connect(ctx: StudentContext): void;
  disconnect(): void;
  send(msg: UserMessage): void;
  onChunk: OnChunkCb | null;
  onComplete: OnCompleteCb | null;
  onWidget: OnWidgetCb | null;
  onError: OnErrorCb | null;
}
