
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import {
  colors,
  spacing,
  radius,
  typography,
} from '../../theme';

import type { ChatMessage } from '../../types/chat';
import { useChat } from '../../hooks/useChat';

import SpendingSummary from '../widgets/SpendingSummary';
import TransferDraft from '../widgets/TransferDraft';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({
  message,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const {
    widgetActionStates,
    handleWidgetAction,
  } = useChat();

  // Historical messages may contain text inside blocks.
  // Live streamed messages use message.text.
  const blockText = message.blocks
    ?.filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n\n');

  const messageText = (
    message.text ?? blockText ?? ''
  ).trim();

  const hasWidgets = Boolean(message.widgets?.length);

  if (
    !messageText &&
    !hasWidgets &&
    message.status !== 'pending'
  ) {
    return null;
  }

  return (
    <View
      style={[
        styles.row,
        isUser ? styles.userRow : styles.assistantRow,
      ]}
    >
      {(!!messageText || message.status === 'pending') && (
        <View
          style={[
            styles.bubble,
            isUser
              ? styles.userBubble
              : styles.assistantBubble,
          ]}
        >
          {messageText ? (
            <Text style={styles.messageText}>
              {messageText}
            </Text>
          ) : (
            <Text style={styles.statusText}>
              Sending...
            </Text>
          )}

          {message.status === 'failed' && (
            <Text style={styles.failedText}>
              Not sent
            </Text>
          )}
        </View>
      )}

      {!isUser &&
        message.widgets?.map(widget => {
          switch (widget.type) {
            case 'spending_summary':
              return (
                <SpendingSummary
                  key={widget.id}
                  widget={widget}
                />
              );

            case 'transfer_draft':
              return (
                <TransferDraft
                  key={widget.id}
                  widget={widget}
                  actionState={widgetActionStates[widget.id]}
                  onAction={actionId =>
                    void handleWidgetAction(widget.id, actionId)
                  }
                />
              );

            default:
              // Unknown widget types must not crash the chat.
              return null;
          }
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    marginVertical: spacing.xs,
  },

  userRow: {
    alignItems: 'flex-end',
  },

  assistantRow: {
    alignItems: 'flex-start',
  },

  bubble: {
    maxWidth: '85%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
  },

  userBubble: {
    backgroundColor: colors.brand,
    borderBottomRightRadius: spacing.sm,
  },

  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: spacing.sm,
  },

  messageText: {
    ...typography.body,
    color: colors.text,
  },

  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  failedText: {
    ...typography.caption,
    color: '#FF7777',
    marginTop: spacing.xs,
  },
});
