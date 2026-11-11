
import { BASE_URL, SESSION_TOKEN } from './config';
import { API_ENDPOINTS } from './endpoints';
import { SSEParser } from '../utils/sseParser';

import type { ChatStreamEvent } from '../types/chat';

interface StreamOptions {
  messageId: string;
  afterSeq: number;
  signal?: AbortSignal;
  onEvent: (event: ChatStreamEvent) => boolean;
}

const TERMINAL_EVENTS = new Set([
  'message.completed',
  'message.failed',
  'message.cancelled',
]);

const VALID_EVENTS = new Set([
  'message.created',
  'message.delta',
  'message.widget',
  'message.completed',
  'message.failed',
  'message.cancelled',
]);

function parseStreamEvent(
  eventName: string,
  data: string,
): ChatStreamEvent | null {
  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(data) as Record<string, unknown>;
  } catch {
    return null;
  }

  const type = typeof payload.type === 'string' ? payload.type : eventName;

  if (!VALID_EVENTS.has(type)) {
    return null;
  }

  if (
    typeof payload.messageId !== 'string' ||
    typeof payload.seq !== 'number' ||
    !Number.isInteger(payload.seq) ||
    payload.seq < 0
  ) {
    return null;
  }

  const base = {
    messageId: payload.messageId,
    seq: payload.seq,
  };

  switch (type) {
    case 'message.created':
      return { ...base, type };

    case 'message.delta':
      return typeof payload.text === 'string'
        ? { ...base, type, text: payload.text }
        : null;

    case 'message.widget':
      return { ...base, type, widget: payload.widget };

    case 'message.completed':
      return { ...base, type };

    case 'message.failed':
      return {
        ...base,
        type,
        code:
          typeof payload.code === 'string'
            ? payload.code
            : 'assistant_failed',
      };

    case 'message.cancelled':
      return { ...base, type };

    default:
      return null;
  }
}

export function connectToAssistantStream({
  messageId,
  afterSeq,
  signal,
  onEvent,
}: StreamOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Stream aborted'));
      return;
    }

    const xhr = new XMLHttpRequest();
    const parser = new SSEParser();

    let responseOffset = 0;
    let settled = false;

    const cleanup = () => {
      signal?.removeEventListener('abort', handleAbort);
      xhr.onprogress = null;
      xhr.onload = null;
      xhr.onerror = null;
      xhr.ontimeout = null;
      xhr.onreadystatechange = null;
    };

    const finish = (error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    const handleAbort = () => {
      xhr.abort();
      finish(new Error('Stream aborted'));
    };

    const processChunk = (chunk: string) => {
      const events = parser.push(chunk);

      for (const sseEvent of events) {
        const event = parseStreamEvent(sseEvent.event, sseEvent.data);

        if (!event || event.messageId !== messageId) {
          continue;
        }

        // false means the consumer detected a sequence gap.
        if (!onEvent(event)) {
          finish(new Error('Stream sequence gap; reconnect required'));
          xhr.abort();
          return;
        }

        if (TERMINAL_EVENTS.has(event.type)) {
          finish();
          xhr.abort();
          return;
        }
      }
    };

    signal?.addEventListener('abort', handleAbort);

    const endpoint = API_ENDPOINTS.CHAT_STREAM(messageId);
    const separator = endpoint.includes('?') ? '&' : '?';
    const url =
      `${BASE_URL}${endpoint}${separator}afterSeq=${afterSeq}`;

    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${SESSION_TOKEN}`);
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.timeout = 0;

    xhr.onprogress = () => {
      if (settled) {
        return;
      }

      const newText = xhr.responseText.slice(responseOffset);
      responseOffset = xhr.responseText.length;

      if (newText) {
        processChunk(newText);
      }
    };

    xhr.onload = () => {
      if (settled) {
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        finish(new Error(`Stream request failed: HTTP ${xhr.status}`));
        return;
      }

      // A successful HTTP response without a terminal event is still
      // an interrupted stream. The caller should reconnect.
      finish(new Error('Stream ended before a terminal event'));
    };

    xhr.onerror = () => {
      finish(new Error('Network error while receiving stream'));
    };

    xhr.ontimeout = () => {
      finish(new Error('Stream connection timed out'));
    };

    xhr.send();
  });
}
