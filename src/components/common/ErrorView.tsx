
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import { colors, spacing, radius, typography } from '../../theme';

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorView({
  message,
  onRetry,
}: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>ⓘ</Text>

      <Text style={styles.message}>{message}</Text>

      <Pressable
        onPress={onRetry}
        style={styles.retry}
        hitSlop={8}
      >
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  icon: {
    color: colors.error,
    fontSize: 22,
  },
  message: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  retry: {
    padding: spacing.sm,
  },
  retryText: {
    color: colors.brand,
    fontWeight: '600',
    fontSize: 14,
  },
});
