
import React from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';

import {
  colors,
  spacing,
  radius,
  typography,
} from '../../theme';

interface ChatEmptyStateProps {
  firstName?: string;
  suggestions: string[];
  onSelectSuggestion: (text: string) => void;
}

export default function ChatEmptyState({
  firstName,
  suggestions,
  onSelectSuggestion,
}: ChatEmptyStateProps) {
  const greetingName = firstName?.trim() || 'there';

  return (
    <View style={styles.container}>
      {/* Mal glowing orb */}
      <View style={styles.orbGlow}>
        <LinearGradient
          colors={['#53F5C2', colors.brand, '#00B987']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.orb}
        />
      </View>

      <Text style={styles.title}>
        How can I help, {greetingName}?
      </Text>

      <View style={styles.suggestions}>
        {suggestions.map((suggestion, index) => (
          <Pressable
            key={`${suggestion}-${index}`}
            onPress={() => onSelectSuggestion(suggestion)}
            style={({ pressed }) => [
              styles.suggestionChip,
              pressed && styles.suggestionChipPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={suggestion}
          >
            <Text style={styles.suggestionText}>
              {suggestion}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
  },
  orbGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: spacing.lg,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 12,
  },
  orb: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  title: {
    ...typography.headerSmall,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  suggestions: {
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  suggestionChip: {
    maxWidth: '100%',
    backgroundColor: '#30393B',
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  suggestionChipPressed: {
    opacity: 0.7,
  },
  suggestionText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
  },
});
