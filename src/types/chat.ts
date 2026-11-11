
export type ChatRole = 'user' | 'assistant';

export type ChatMessageStatus =
  | 'pending'
  | 'streaming'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | (string & {});

export interface TextMessageBlock {
  type: 'text';
  text: string;
}
import type { ChatWidget } from './widgets';

export interface WidgetMessageBlock {
    type: 'widget';
    widget: ChatWidget;
  }

export type ChatMessageBlock =
  | TextMessageBlock
  | WidgetMessageBlock;

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text?: string;
  blocks?: ChatMessageBlock[];
  status?: ChatMessageStatus;
  createdAt?: string;
  clientMessageId?: string;
  lastSeq?: number;
  widgets?: ChatWidget[];

  [key: string]: unknown;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  nextBefore: string | null;
}

export interface SendMessageRequest {
  clientMessageId: string;
  text: string;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessageId: string;
  replayed: boolean;
}

export interface ChatMessageStatusResponse {
  message: ChatMessage;
  [key: string]: unknown;
}

export type ChatStreamEventType =
  | 'message.created'
  | 'message.delta'
  | 'message.widget'
  | 'message.completed'
  | 'message.failed'
  | 'message.cancelled';

export interface ChatStreamEventBase {
  messageId: string;
  seq: number;
}

export interface MessageCreatedEvent extends ChatStreamEventBase {
  type: 'message.created';
}

export interface MessageDeltaEvent extends ChatStreamEventBase {
  type: 'message.delta';
  text: string;
}

export interface MessageWidgetEvent extends ChatStreamEventBase {
  type: 'message.widget';
  widget: unknown;
}

export interface MessageCompletedEvent extends ChatStreamEventBase {
  type: 'message.completed';
}

export interface MessageFailedEvent extends ChatStreamEventBase {
  type: 'message.failed';
  code: string;
}

export interface MessageCancelledEvent extends ChatStreamEventBase {
  type: 'message.cancelled';
}

export type ChatStreamEvent =
  | MessageCreatedEvent
  | MessageDeltaEvent
  | MessageWidgetEvent
  | MessageCompletedEvent
  | MessageFailedEvent
  | MessageCancelledEvent;

export interface ChatMessagesQuery {
  limit?: number;
  before?: string;
}
