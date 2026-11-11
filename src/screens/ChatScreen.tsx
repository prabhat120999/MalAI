import React, { useCallback, useEffect, useRef } from 'react';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatEmptyState from '../components/chat/ChatEmptyState';
import { useGetSuggestions } from '../hooks/useHome';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';

import { useChat } from '../hooks/useChat';

import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import TypingIndicator from '../components/chat/TypingIndicator';

import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ navigation, route }: Props) {
  const {
    messages,
    isLoadingHistory,
    isSending,
    error,
    loadHistory,
    sendMessage,
    retryLastMessage,
    clearError,
    activeAssistantMessageId,
    loadOlderMessages,
    isLoadingOlder,
    hasMore,
    isHydrated
  } = useChat();

  const chatSuggestions = useGetSuggestions();
  const firstName = route.params?.firstName;
  const fallbackSuggestions = [
    'How much did I spend on dining?',
    'Send AED 250 to Omar',
    "What's my total balance?",
  ];

  const suggestions =
    chatSuggestions.data?.suggestions?.map(item => item.text) ??
    fallbackSuggestions;
  const initialMessage = route.params?.initialMessage;

  const initialMessageSentRef = useRef(false);
  const listRef = useRef<FlatList>(null);
  const hasInitiallyScrolledRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);

  const scrollToLatest = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);
  useEffect(() => {
    if (!isHydrated) {
      return;
    }
  
    void loadHistory();
  }, [isHydrated, loadHistory]);

  // Once history has loaded, position the list at the latest message.
  useEffect(() => {
    if (isLoadingHistory || hasInitiallyScrolledRef.current) {
      return;
    }

    hasInitiallyScrolledRef.current = true;
    shouldStickToBottomRef.current = true;

    scrollToLatest(false);
  }, [isLoadingHistory, scrollToLatest]);

  useEffect(() => {
    if (!isHydrated || !initialMessage || initialMessageSentRef.current) {
      return;
    }
  
    initialMessageSentRef.current = true;
    void sendMessage(initialMessage);
  }, [isHydrated, initialMessage, sendMessage]);

  const handleSend = useCallback(
    (text: string) => {
      shouldStickToBottomRef.current = true;
      void sendMessage(text);
    },
    [sendMessage],
  );

  const isAssistantWaiting = messages.some(
    message =>
      message.id === activeAssistantMessageId &&
      message.status === 'streaming' &&
      !message.text,
  );
  const handleSuggestionSelect = useCallback(
    (text: string) => {
      shouldStickToBottomRef.current = true;
      void sendMessage(text);
    },
    [sendMessage],
  );
  const renderMessage = useCallback(
    ({ item }: { item: (typeof messages)[number] }) => (
      <MessageBubble message={item} />
    ),
    [],
  );

  return (
    <View style={styles.root}>
      {/* Gradient covers the entire screen, including status bar area */}
      <LinearGradient
        colors={[
          'rgba(0, 105, 75, 0.28)',
          'rgba(0, 55, 43, 0.12)',
          colors.page,
        ]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backText}>‹</Text>
            </Pressable>

            <Text style={styles.title}>Mal</Text>

            <View style={styles.headerSpacer} />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>

              <Pressable
                onPress={() => void retryLastMessage()}
                style={styles.retryButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Retry assistant response"
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>

              <Pressable
                onPress={clearError}
                style={styles.dismissButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Dismiss error"
              >
                <Text style={styles.dismissText}>×</Text>
              </Pressable>
            </View>
          )}

          {/* Messages */}
          {(!isHydrated || (isLoadingHistory && messages.length === 0)) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.loadingText}>Loading conversation...</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              style={styles.messageList}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => {
                if (shouldStickToBottomRef.current) {
                  scrollToLatest(false);
                }
              }}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
              }}
              onScroll={({ nativeEvent }) => {
                const {
                  contentOffset,
                  contentSize,
                  layoutMeasurement,
                } = nativeEvent;

                const distanceFromBottom =
                  contentSize.height -
                  (contentOffset.y + layoutMeasurement.height);

                // Continue following new messages only when near the bottom.
                shouldStickToBottomRef.current =
                  distanceFromBottom < 120;

                // Load older messages when the user reaches the top.
                if (
                  contentOffset.y <= 60 &&
                  hasMore &&
                  !isLoadingOlder
                ) {
                  void loadOlderMessages();
                }
              }}
              scrollEventThrottle={16}
              ListEmptyComponent={
                <ChatEmptyState
                  firstName={firstName}
                  suggestions={suggestions}
                  onSelectSuggestion={handleSuggestionSelect}
                />
              }
              ListFooterComponent={
                isAssistantWaiting ? <TypingIndicator /> : undefined
              }
              ListHeaderComponent={
                isLoadingOlder ? (
                  <View style={styles.olderLoading}>
                    <ActivityIndicator color={colors.brand} />
                    <Text style={styles.loadingText}>
                      Loading older messages...
                    </Text>
                  </View>
                ) : undefined
              }
            />
          )}

          <ChatInput
            onSend={handleSend}
            disabled={isSending || !!activeAssistantMessageId}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.page,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 34,
  },
  title: {
    ...typography.headerXSmall,
    color: colors.text,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  headerSpacer: {
    width: 40,
    marginLeft: 'auto',
  },
  messageList: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.screen,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 20,
    gap: spacing.sm,
  },

  errorText: {
    ...typography.body,
    color: '#FF7777',
    flex: 1,
  },

  retryButton: {
    minWidth: 64,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },

  retryText: {
    ...typography.body,
    color: colors.brand,
    fontWeight: '700',
  },

  dismissButton: {
    width: 40,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dismissText: {
    color: colors.textSecondary,
    fontSize: 26,
  },
  olderLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
});
