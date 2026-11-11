
import React, { useState, useCallback } from 'react';

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';

import { colors, spacing, radius, typography } from '../../theme';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  disabled = false,
}: ChatInputProps) {
  const [text, setText] = useState('');

  const canSend = text.trim().length > 0 && !disabled;

  const handleSend = useCallback(() => {
    const message = text.trim();

    if (!message || disabled) {
      return;
    }

    setText('');
    Keyboard.dismiss();
    onSend(message);
  }, [text, disabled, onSend]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ask Mal anything..."
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          multiline
          maxLength={4000}
          editable={!disabled}
          textAlignVertical="center"
          blurOnSubmit={false}
          accessibilityLabel="Message Mal"
          autoCapitalize='none'
        />

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[
            styles.sendButton,
            canSend
              ? styles.sendButtonActive
              : styles.sendButtonInactive,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text
            style={[
              styles.sendIcon,
              canSend
                ? styles.sendIconActive
                : styles.sendIconInactive,
            ]}
          >
            ↑
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  container: {
    minHeight: 64,
    maxHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 35, 35, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(130, 150, 145, 0.30)',
    borderRadius: radius.round,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.bodyLarge,
    color: colors.text,
    minHeight: 48,
    maxHeight: 96,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonActive: {
    backgroundColor: colors.brand,
  },
  sendButtonInactive: {
    backgroundColor: '#77817F',
  },
  sendIcon: {
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 32,
  },
  sendIconActive: {
    color: colors.page,
  },
  sendIconInactive: {
    color: '#26312F',
  },
});
