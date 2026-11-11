
import React from 'react';
import {
  FlatList,
  Pressable,
  Text,
  StyleSheet,
  View,
} from 'react-native';

import Skeleton from '../common/Skeleton';

import {
  colors,
  spacing,
  radius,
  typography,
} from '../../theme';

import type { Suggestion } from '../../types/home';

interface SuggestionChipsProps {
  suggestions: Suggestion[] | null;
  isLoading: boolean;
  onSelect: (text: string) => void;
}

export default function SuggestionChips({
  suggestions,
  isLoading,
  onSelect,
}: SuggestionChipsProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Skeleton width={170} height={36} borderRadius={18} />
        <Skeleton width={110} height={36} borderRadius={18} />
      </View>
    );
  }

  return (
    <FlatList
      horizontal
      data={suggestions ?? []}
      keyExtractor={item => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => (
        <View style={{ width: spacing.sm }} />
      )}
      renderItem={({ item }) => (
        <Pressable
          style={styles.chip}
          onPress={() => onSelect(item.text)}
        >
          <Text style={styles.text}>{item.text}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  content: {
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.round,
  },
  text: {
    ...typography.body,
    color: colors.text,
  },
});
