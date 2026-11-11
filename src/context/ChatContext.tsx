import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
  } from 'react';
  import { AppState } from 'react-native';
  import type { ChatWidget } from '../types/widgets';
  import type {
    ChatMessage,
    ChatStreamEvent,
    SendMessageRequest,
  } from '../types/chat';
  import { ApiError } from '../types/api';
  import {
    getChatHistory,
    getChatMessage,
    sendChatMessage,
    performWidgetAction,
  } from '../api/chatApi';
  import { connectToAssistantStream } from '../api/chatStream';
  import {
    loadChatState,
    saveChatState,
  } from '../utils/chatStorage';
  import type { PersistedChatState } from '../utils/chatStorage';
  
  export interface WidgetActionState {
    status: 'processing' | 'success' | 'error';
    actionId: string;
    message?: string;
  }
  
  interface ChatContextValue {
    messages: ChatMessage[];
    isLoadingHistory: boolean;
    isLoadingOlder: boolean;
    isSending: boolean;
    hasMore: boolean;
    activeAssistantMessageId: string | null;
    error: string | null;
    isHydrated: boolean;
    loadHistory: () => Promise<void>;
    loadOlderMessages: () => Promise<void>;
    sendMessage: (text: string) => Promise<void>;
    retryLastMessage: () => Promise<void>;
    clearError: () => void;
    widgetActionStates: Record<string, WidgetActionState>;
    handleWidgetAction: (widgetId: string, actionId: string) => Promise<void>;
  }
  
  const ChatContext = createContext<ChatContextValue | null>(null);
  const MAX_STREAM_RETRIES = 5;
  
  const createId = (prefix: string) =>
    `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  
  const isTerminal = (status?: string) =>
    status === 'completed' || status === 'failed' || status === 'cancelled';
  
  const errorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;
  
  const sleep = (ms: number) =>
    new Promise<void>(resolve => setTimeout(resolve, ms));
  
  function mergeMessages(
    existing: ChatMessage[],
    incoming: ChatMessage[],
    activeId?: string | null,
  ): ChatMessage[] {
    const result = [...existing];
  
    for (const message of incoming) {
      const index = result.findIndex(
        current =>
          current.id === message.id ||
          (Boolean(current.clientMessageId) &&
            current.clientMessageId === message.clientMessageId),
      );
  
      if (index === -1) {
        result.push(message);
        continue;
      }
  
      const previous = result[index];
      // History may lag behind an in-flight stream. Do not erase local deltas.
      const preserveLocal =
        previous.id === activeId &&
        (previous.lastSeq ?? -1) >= 0 &&
        !isTerminal(message.status);
  
      result[index] = {
        ...previous,
        ...message,
        ...(preserveLocal
          ? {
              text: previous.text,
              widgets: previous.widgets,
              blocks: previous.blocks,
              lastSeq: previous.lastSeq,
              status: previous.status,
            }
          : {}),
        clientMessageId:
          message.clientMessageId ?? previous.clientMessageId,
      };
    }
  
    return result.sort(
      (a, b) =>
        (Date.parse(a.createdAt ?? '') || 0) -
        (Date.parse(b.createdAt ?? '') || 0),
    );
  }
  
  export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [activeAssistantMessageId, setActiveAssistantMessageId] =
      useState<string | null>(null);
    const [widgetActionStates, setWidgetActionStates] = useState<
      Record<string, WidgetActionState>
    >({});
    const [error, setError] = useState<string | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);
  
    const mountedRef = useRef(true);
    const hydrationRef = useRef(false);
    const messagesRef = useRef<ChatMessage[]>([]);
    const activeIdRef = useRef<string | null>(null);
    const widgetStatesRef = useRef<Record<string, WidgetActionState>>({});
    const retryPayloadRef = useRef<SendMessageRequest | null>(null);
    const lastSeqRef = useRef<Map<string, number>>(new Map());
    const widgetKeysRef = useRef<Map<string, string>>(new Map());
    const widgetLocksRef = useRef<Set<string>>(new Set());
    const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
    const streamControllerRef = useRef<AbortController | null>(null);
    const streamRunsRef = useRef<Map<string, Promise<void>>>(new Map());
    const recoveryRunsRef = useRef<Map<string, Promise<void>>>(new Map());
    const appStateRef = useRef(AppState.currentState);
    const sendingRef = useRef(false);
    const historyLoadedRef = useRef(false);
    const historyLoadingRef = useRef(false);
    const olderLoadingRef = useRef(false);
    const nextBeforeRef = useRef<string | null>(null);
    const hasMoreRef = useRef(true);
    const startupRecoveryRef = useRef(false);
    const streamGenerationRef = useRef(0);
  
    const commitMessages = useCallback(
      (update: (current: ChatMessage[]) => ChatMessage[]) => {
        const next = update(messagesRef.current);
        messagesRef.current = next;
        if (mountedRef.current) setMessages(next);
      },
      [],
    );
  
    const commitActiveId = useCallback((id: string | null) => {
      activeIdRef.current = id;
      if (mountedRef.current) setActiveAssistantMessageId(id);
    }, []);
  
    const commitWidgetState = useCallback(
      (widgetId: string, state: WidgetActionState) => {
        const next = { ...widgetStatesRef.current, [widgetId]: state };
        widgetStatesRef.current = next;
        if (mountedRef.current) setWidgetActionStates(next);
      },
      [],
    );
  
    // Each snapshot contains both message content and its processed SSE sequence.
    // Writes are ordered; the caller can await a write before a network mutation.
    const persistSnapshot = useCallback((): Promise<void> => {
      if (!hydrationRef.current) return Promise.resolve();
  
      const snapshot: PersistedChatState = {
        messages: messagesRef.current,
        activeAssistantMessageId: activeIdRef.current,
        retryPayload: retryPayloadRef.current,
        lastSequences: Object.fromEntries(lastSeqRef.current),
        widgetIdempotencyKeys: Object.fromEntries(widgetKeysRef.current),
        widgetActionStates: widgetStatesRef.current,
        updatedAt: Date.now(),
      };
  
      const write = writeQueueRef.current
        .catch(() => undefined)
        .then(() => saveChatState(snapshot));
      writeQueueRef.current = write;
      return write;
    }, []);
  
    const persistQuietly = useCallback(() => {
      void persistSnapshot().catch(err => {
        console.warn('[ChatContext] Persistence failed:', err);
        if (mountedRef.current) {
          setError('Could not save chat progress. Please check device storage.');
        }
      });
    }, [persistSnapshot]);
  
    const updateMessage = useCallback(
      (id: string, update: (message: ChatMessage) => ChatMessage) => {
        commitMessages(current =>
          current.map(message =>
            message.id === id ? update(message) : message,
          ),
        );
      },
      [commitMessages],
    );
  
    const handleStreamEvent = useCallback(
      (event: ChatStreamEvent): boolean => {
        if (!mountedRef.current || event.messageId !== activeIdRef.current) {
          return false;
        }
  
        const previous = lastSeqRef.current.get(event.messageId) ?? -1;
        if (event.seq <= previous) return true;
        if (event.seq !== previous + 1) return false;
  
        // Mutate content and sequence synchronously, then snapshot together.
        updateMessage(event.messageId, message => {
          const base: ChatMessage = { ...message, lastSeq: event.seq };
  
          switch (event.type) {
            case 'message.created':
              return { ...base, status: 'streaming' };
            case 'message.delta':
              return {
                ...base,
                text: (message.text ?? '') + event.text,
                status: 'streaming',
              };
            case 'message.widget':
              return {
                ...base,
                widgets: [
                  ...(message.widgets ?? []),
                  event.widget as ChatWidget,
                ],
              };
            case 'message.completed':
              return { ...base, status: 'completed' };
            case 'message.failed':
              return {
                ...base,
                status: 'failed',
                failureCode: event.code,
              };
            case 'message.cancelled':
              return { ...base, status: 'cancelled' };
            default:
              return base;
          }
        });
  
        lastSeqRef.current.set(event.messageId, event.seq);
  
        if (
          event.type === 'message.completed' ||
          event.type === 'message.failed' ||
          event.type === 'message.cancelled'
        ) {
          commitActiveId(null);
        }
  
        persistQuietly();
        return true;
      },
      [commitActiveId, persistQuietly, updateMessage],
    );
  
    const consumeAssistantStream = useCallback(
      (assistantId: string): Promise<void> => {
        const running = streamRunsRef.current.get(assistantId);
        if (running) return running;
  
        const generation = streamGenerationRef.current;
  
        const run = (async () => {
          for (let attempt = 0; attempt < MAX_STREAM_RETRIES; attempt += 1) {
            if (
              !mountedRef.current ||
              appStateRef.current !== 'active' ||
              generation !== streamGenerationRef.current ||
              activeIdRef.current !== assistantId
            ) {
              return;
            }
  
            const controller = new AbortController();
            streamControllerRef.current = controller;
  
            try {
              await connectToAssistantStream({
                messageId: assistantId,
                afterSeq: lastSeqRef.current.get(assistantId) ?? -1,
                signal: controller.signal,
                onEvent: handleStreamEvent,
              });
              return;
            } catch {
              if (
                controller.signal.aborted ||
                !mountedRef.current ||
                appStateRef.current !== 'active' ||
                generation !== streamGenerationRef.current ||
                activeIdRef.current !== assistantId
              ) {
                return;
              }
  
              const message = messagesRef.current.find(
                item => item.id === assistantId,
              );
              if (isTerminal(message?.status)) return;
  
              if (attempt === MAX_STREAM_RETRIES - 1) {
                setError(
                  'Connection interrupted. Your reply may still be processing. Please retry.',
                );
                return;
              }
  
              await sleep(Math.min(1000 * 2 ** attempt, 8000));
            } finally {
              if (streamControllerRef.current === controller) {
                streamControllerRef.current = null;
              }
            }
          }
        })();
  
        streamRunsRef.current.set(assistantId, run);
        void run.finally(() => {
          if (streamRunsRef.current.get(assistantId) === run) {
            streamRunsRef.current.delete(assistantId);
          }
        });
        return run;
      },
      [handleStreamEvent],
    );
  
    const recoverAssistantReply = useCallback(
      (assistantId: string): Promise<void> => {
        const running = recoveryRunsRef.current.get(assistantId);
        if (running) return running;
  
        const run = (async () => {
          try {
            const result = await getChatMessage(assistantId);
            if (!mountedRef.current || activeIdRef.current !== assistantId) {
              return;
            }
  
            // The status endpoint can be ahead of our local stream. A terminal
            // server reply is authoritative, including its final text/widgets.
            const serverMessage =
              'message' in result && result.message
                ? (result.message as ChatMessage)
                : result;
  
            if (isTerminal(serverMessage.status)) {
              commitMessages(current =>
                mergeMessages(current, [serverMessage]),
              );
              commitActiveId(null);
              await persistSnapshot();
              return;
            }
  
            // Preserve local deltas; resume SSE from our own saved lastSeq.
            if (!messagesRef.current.some(m => m.id === assistantId)) {
              commitMessages(current =>
                mergeMessages(current, [serverMessage]),
              );
            }
  
            if (appStateRef.current === 'active') {
              void consumeAssistantStream(assistantId);
            }
          } catch (err) {
            if (mountedRef.current) {
              setError(
                errorMessage(err, 'Unable to restore the assistant response.'),
              );
            }
          }
        })();
  
        recoveryRunsRef.current.set(assistantId, run);
        void run.finally(() => {
          if (recoveryRunsRef.current.get(assistantId) === run) {
            recoveryRunsRef.current.delete(assistantId);
          }
        });
        return run;
      },
      [commitActiveId, commitMessages, consumeAssistantStream, persistSnapshot],
    );
  
    const submitMessage = useCallback(
      async (payload: SendMessageRequest) => {
        const response = await sendChatMessage(payload);
        if (!mountedRef.current) return;
  
        commitMessages(current =>
          mergeMessages(
            current,
            [
              {
                ...response.userMessage,
                clientMessageId: payload.clientMessageId,
                status: response.userMessage.status ?? 'completed',
              },
              {
                id: response.assistantMessageId,
                role: 'assistant',
                text: '',
                status: 'streaming',
                createdAt: new Date().toISOString(),
              },
            ],
            activeIdRef.current,
          ),
        );
  
        commitActiveId(response.assistantMessageId);
        retryPayloadRef.current = null;
  
        // If this write fails, retain the accepted assistant ID in memory.
        // The stream can still proceed, but surface the persistence failure.
        try {
          await persistSnapshot();
        } catch (err) {
          setError(errorMessage(err, 'Unable to save assistant state.'));
        }
  
        if (appStateRef.current === 'active') {
          void consumeAssistantStream(response.assistantMessageId);
        }
      },
      [commitActiveId, commitMessages, consumeAssistantStream, persistSnapshot],
    );
  
    const sendPayload = useCallback(
      async (payload: SendMessageRequest) => {
        if (sendingRef.current) return;
        sendingRef.current = true;
        setIsSending(true);
        setError(null);
  
        try {
          // Never POST until the original clientMessageId is durable.
          await persistSnapshot();
          await submitMessage(payload);
        } catch (err) {
          if (!mountedRef.current) return;
          const apiError = err instanceof ApiError ? err : null;
          setError(
            apiError?.code === 'assistant_busy'
              ? 'Mal is still replying. Please wait a moment.'
              : errorMessage(err, 'Unable to send message.'),
          );
          commitMessages(current =>
            current.map(message =>
              message.clientMessageId === payload.clientMessageId
                ? { ...message, status: 'failed' }
                : message,
            ),
          );
          persistQuietly();
        } finally {
          sendingRef.current = false;
          if (mountedRef.current) setIsSending(false);
        }
      },
      [commitMessages, persistQuietly, persistSnapshot, submitMessage],
    );
  
    const sendMessage = useCallback(
      async (text: string) => {
        const trimmed = text.trim();
        if (
          !hydrationRef.current ||
          !trimmed ||
          sendingRef.current ||
          activeIdRef.current ||
          retryPayloadRef.current
        ) {
          return;
        }
  
        const payload: SendMessageRequest = {
          clientMessageId: createId('client'),
          text: trimmed,
        };
        retryPayloadRef.current = payload;
  
        commitMessages(current =>
          mergeMessages(current, [
            {
              id: payload.clientMessageId,
              clientMessageId: payload.clientMessageId,
              role: 'user',
              text: trimmed,
              status: 'pending',
              createdAt: new Date().toISOString(),
            },
          ]),
        );
  
        await sendPayload(payload);
      },
      [commitMessages, sendPayload],
    );
  
    const retryLastMessage = useCallback(async () => {
      if (!hydrationRef.current) return;
  
      const activeId = activeIdRef.current;
      if (activeId) {
        setError(null);
        await recoverAssistantReply(activeId);
        return;
      }
  
      const payload = retryPayloadRef.current;
      if (!payload || sendingRef.current) return;
  
      commitMessages(current =>
        current.map(message =>
          message.clientMessageId === payload.clientMessageId
            ? { ...message, status: 'pending' }
            : message,
        ),
      );
      await sendPayload(payload);
    }, [commitMessages, recoverAssistantReply, sendPayload]);
  
    const loadHistory = useCallback(async () => {
      if (
        !hydrationRef.current ||
        historyLoadedRef.current ||
        historyLoadingRef.current
      ) {
        return;
      }
  
      historyLoadingRef.current = true;
      setIsLoadingHistory(true);
      try {
        const response = await getChatHistory({ limit: 20 });
        if (!mountedRef.current) return;
  
        commitMessages(current =>
          mergeMessages(current, response.messages, activeIdRef.current),
        );
        hasMoreRef.current = response.hasMore;
        setHasMore(response.hasMore);
        nextBeforeRef.current = response.nextBefore;
        historyLoadedRef.current = true;
        persistQuietly();
      } catch (err) {
        if (mountedRef.current) {
          setError(errorMessage(err, 'Unable to load chat history.'));
        }
      } finally {
        historyLoadingRef.current = false;
        if (mountedRef.current) setIsLoadingHistory(false);
      }
    }, [commitMessages, persistQuietly]);
  
    const loadOlderMessages = useCallback(async () => {
      const cursor = nextBeforeRef.current;
      if (
        !hydrationRef.current ||
        !cursor ||
        !hasMoreRef.current ||
        olderLoadingRef.current
      ) {
        return;
      }
  
      olderLoadingRef.current = true;
      setIsLoadingOlder(true);
      try {
        const response = await getChatHistory({
          limit: 20,
          before: cursor,
        });
        if (!mountedRef.current) return;
  
        commitMessages(current =>
          mergeMessages(current, response.messages, activeIdRef.current),
        );
        hasMoreRef.current = response.hasMore;
        setHasMore(response.hasMore);
        nextBeforeRef.current = response.nextBefore;
        persistQuietly();
      } catch (err) {
        if (mountedRef.current) {
          setError(errorMessage(err, 'Unable to load older messages.'));
        }
      } finally {
        olderLoadingRef.current = false;
        if (mountedRef.current) setIsLoadingOlder(false);
      }
    }, [commitMessages, persistQuietly]);
  
    const handleWidgetAction = useCallback(
      async (widgetId: string, actionId: string) => {
        if (!hydrationRef.current || widgetLocksRef.current.has(widgetId)) {
          return;
        }
  
        const previous = widgetStatesRef.current[widgetId];
        if (previous?.status === 'success') return;
        // Never switch from a potentially submitted confirm to cancel, or vice versa.
        if (previous && previous.actionId !== actionId) return;
  
        const keyName = `${widgetId}:${actionId}`;
        let idempotencyKey = widgetKeysRef.current.get(keyName);
        if (!idempotencyKey) {
          idempotencyKey = createId('widget');
          widgetKeysRef.current.set(keyName, idempotencyKey);
        }
  
        widgetLocksRef.current.add(widgetId);
        commitWidgetState(widgetId, { status: 'processing', actionId });
  
        try {
          // Persist the key BEFORE any potentially irreversible action.
          await persistSnapshot();
          await performWidgetAction(widgetId, actionId, idempotencyKey);
  
          if (!mountedRef.current) return;
          commitWidgetState(widgetId, {
            status: 'success',
            actionId,
            message:
              actionId === 'confirm'
                ? 'Transfer confirmed successfully.'
                : 'Transfer cancelled.',
          });
        } catch (err) {
          if (!mountedRef.current) return;
  
          const apiError = err instanceof ApiError ? err : null;
          commitWidgetState(widgetId, {
            status: apiError?.code === 'already_actioned' ? 'success' : 'error',
            actionId,
            message:
              apiError?.code === 'already_actioned'
                ? 'This transfer has already been actioned.'
                : errorMessage(err, 'Unable to process this action.'),
          });
        } finally {
          widgetLocksRef.current.delete(widgetId);
          persistQuietly();
        }
      },
      [commitWidgetState, persistQuietly, persistSnapshot],
    );
  
    // Hydrate before history requests, POST retries or stream recovery.
    useEffect(() => {
      let cancelled = false;
      mountedRef.current = true;
  
      const restore = async () => {
        try {
          const saved = await loadChatState();
          if (cancelled) return;
  
          if (saved) {
            messagesRef.current = saved.messages;
            setMessages(saved.messages);
  
            activeIdRef.current = saved.activeAssistantMessageId;
            setActiveAssistantMessageId(saved.activeAssistantMessageId);
            retryPayloadRef.current = saved.retryPayload;
  
            lastSeqRef.current = new Map(
              Object.entries(saved.lastSequences ?? {}).map(([id, seq]) => [
                id,
                Number(seq),
              ]),
            );
            widgetKeysRef.current = new Map(
              Object.entries(saved.widgetIdempotencyKeys ?? {}),
            );
  
            const restored: Record<string, WidgetActionState> = {};
            for (const [id, state] of Object.entries(
              saved.widgetActionStates ?? {},
            )) {
              restored[id] =
                state.status === 'processing'
                  ? {
                      ...state,
                      status: 'error',
                      message: 'Action status is unknown. Retry to verify.',
                    }
                  : state;
            }
            widgetStatesRef.current = restored;
            setWidgetActionStates(restored);
          }
        } catch (err) {
          console.warn('[ChatContext] Restore failed:', err);
        } finally {
          if (!cancelled) {
            hydrationRef.current = true;
            setIsHydrated(true);
          }
        }
      };
  
      void restore();
  
      return () => {
        cancelled = true;
        mountedRef.current = false;
        streamGenerationRef.current += 1;
        streamControllerRef.current?.abort();
      };
    }, []);
  
    useEffect(() => {
      if (!isHydrated) return;
  
      appStateRef.current = AppState.currentState;
  
      const subscription = AppState.addEventListener('change', nextState => {
        const previous = appStateRef.current;
        appStateRef.current = nextState;
  
        if (previous === 'active' && nextState !== 'active') {
          streamGenerationRef.current += 1;
          streamControllerRef.current?.abort();
          return;
        }
  
        if (previous !== 'active' && nextState === 'active') {
          const assistantId = activeIdRef.current;
          if (assistantId) {
            // Allow the old aborted consumer to exit before starting recovery.
            const oldRun = streamRunsRef.current.get(assistantId);
            void (oldRun ?? Promise.resolve()).finally(() => {
              if (mountedRef.current && activeIdRef.current === assistantId) {
                void recoverAssistantReply(assistantId);
              }
            });
          }
        }
      });
  
      return () => subscription.remove();
    }, [isHydrated, recoverAssistantReply]);
  
    useEffect(() => {
      if (!isHydrated || startupRecoveryRef.current) return;
      startupRecoveryRef.current = true;
  
      if (activeIdRef.current) {
        void recoverAssistantReply(activeIdRef.current);
      } else if (retryPayloadRef.current) {
        void retryLastMessage();
      }
    }, [isHydrated, recoverAssistantReply, retryLastMessage]);
  
    const clearError = useCallback(() => setError(null), []);
  
    return (
      <ChatContext.Provider
        value={{
          messages,
          isLoadingHistory,
          isLoadingOlder,
          isSending,
          hasMore,
          activeAssistantMessageId,
          error,
          isHydrated,
          loadHistory,
          loadOlderMessages,
          sendMessage,
          retryLastMessage,
          clearError,
          widgetActionStates,
          handleWidgetAction,
        }}
      >
        {children}
      </ChatContext.Provider>
    );
  }
  
  export function useChatContext(): ChatContextValue {
    const context = useContext(ChatContext);
    if (!context) {
      throw new Error('useChatContext must be used inside ChatProvider.');
    }
    return context;
  }
  