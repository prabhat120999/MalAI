
import { apiRequest } from './client';
import { API_ENDPOINTS } from './endpoints';

import type {
  ChatMessage,
  ChatHistoryResponse,
  ChatMessagesQuery,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/chat';

/**
 * Fetch chat history.
 * The backend returns messages oldest-first within each page.
 */
export function getChatHistory(
  { limit = 20, before }: ChatMessagesQuery = {},
  signal?: AbortSignal,
): Promise<ChatHistoryResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (before) {
    params.append('before', before);
  }

  return apiRequest<ChatHistoryResponse>(
    `${API_ENDPOINTS.CHAT_HISTORY}?${params.toString()}`,
    { signal },
  );
}

/**
 * Fetch the latest server state of a specific message.
 * Useful for recovering after a disconnected stream.
 */
export function getChatMessage(
  messageId: string,
  signal?: AbortSignal,
): Promise<ChatMessage> {
  return apiRequest<ChatMessage>(
    API_ENDPOINTS.CHAT_MESSAGE(messageId),
    { signal },
  );
}

/**
 * Send a user message.
 *
 * Important:
 * Generate clientMessageId once and reuse the same ID
 * and text for every retry of this message.
 */
export function sendChatMessage(
  payload: SendMessageRequest,
  signal?: AbortSignal,
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(
    API_ENDPOINTS.CHAT_MESSAGES,
    {
      method: 'POST',
      body: payload,
      signal,
    },
  );
}

/**
 * Cancel an assistant response.
 * This does not delete the partial response.
 */
export function cancelAssistantReply(
  assistantMessageId: string,
  signal?: AbortSignal,
): Promise<unknown> {
  return apiRequest<unknown>(
    API_ENDPOINTS.CHAT_CANCEL(assistantMessageId),
    {
      method: 'POST',
      signal,
    },
  );
}

/**
 * Execute a widget action with idempotency protection.
 *
 * The same key must be reused when retrying the same action.
 */
export function performWidgetAction<TResponse = unknown>(
  widgetId: string,
  actionId: string,
  idempotencyKey: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<TResponse> {
  if (idempotencyKey.trim().length < 8) {
    throw new Error('Idempotency key must contain at least 8 characters.');
  }

  return apiRequest<TResponse>(
    API_ENDPOINTS.WIDGET_ACTION(widgetId, actionId),
    {
      method: 'POST',
      body,
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      signal,
    },
  );
}
