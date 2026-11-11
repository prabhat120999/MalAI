
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import {
  colors,
  spacing,
  radius,
  typography,
} from '../../theme';

interface ChatDockProps {
  onPress: () => void;
}

export default function ChatDock({ onPress }: ChatDockProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.input}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Ask Mal anything"
      >
        <View style={styles.malMark} />

        <Text style={styles.placeholder}>
          Ask Mal anything...
        </Text>

        <View style={styles.sendButton}>
          <Text style={styles.sendIcon}>↑</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  input: {
    height: 68,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  malMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand,
  },
  placeholder: {
    ...typography.bodyLarge,
    color: colors.textTertiary,
    flex: 1,
    marginLeft: spacing.md,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 28,
    color: colors.page,
    fontWeight: '600',
  },
});
