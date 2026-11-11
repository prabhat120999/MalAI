
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ChatMessage, SendMessageRequest } from '../types/chat';
import type { WidgetActionState } from '../context/ChatContext';

const CHAT_STORAGE_KEY = '@mal_ai/chat_state_v1';

export interface PersistedChatState {
  messages: ChatMessage[];
  activeAssistantMessageId: string | null;
  retryPayload: SendMessageRequest | null;
  lastSequences: Record<string, number>;
  widgetIdempotencyKeys: Record<string, string>;
  widgetActionStates: Record<string, WidgetActionState>;
  updatedAt: number;
}

export async function loadChatState(): Promise<PersistedChatState | null> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedChatState;

    if (!parsed || !Array.isArray(parsed.messages)) {
      return null;
    }

    return {
      messages: parsed.messages,
      activeAssistantMessageId: parsed.activeAssistantMessageId ?? null,
      retryPayload: parsed.retryPayload ?? null,
      lastSequences: parsed.lastSequences ?? {},
      widgetIdempotencyKeys: parsed.widgetIdempotencyKeys ?? {},
      widgetActionStates: parsed.widgetActionStates ?? {},
      updatedAt: parsed.updatedAt ?? Date.now(),
    };
  } catch (error) {
    console.warn('[ChatStorage] Unable to restore chat state:', error);
    return null;
  }
}

// Intentionally does not swallow errors.
// Callers must know if durable persistence failed before making a request.
export async function saveChatState(
  state: PersistedChatState,
): Promise<void> {
  await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state));
}

export async function clearChatState(): Promise<void> {
  await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
}
