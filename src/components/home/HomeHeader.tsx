import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';

import Skeleton from '../common/Skeleton';

import { colors, spacing, radius, typography } from '../../theme';

interface HomeHeaderProps {
  firstName?: string;
  isLoading: boolean;
  isHidden: boolean;
  onToggleBalance: () => void;
}

export default function HomeHeader({
  firstName,
  isLoading,
  isHidden,
  onToggleBalance,
}: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      {isLoading ? (
        <>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={styles.loadingText}>
            <Skeleton width={90} height={12} />
            <Skeleton width={120} height={20} />
          </View>
        </>
      ) : (
        <>
          <View style={styles.avatar}>
            <Text style={styles.initials}>
              {firstName?.charAt(0).toUpperCase() || 'M'}
            </Text>
          </View>

          <View style={styles.greeting}>
            <Text style={styles.greetingText}>Good morning</Text>

            <Text style={styles.name}>{firstName || 'User'}</Text>
          </View>
        </>
      )}

      <Pressable
        onPress={onToggleBalance}
        style={styles.eyeButton}
        accessibilityRole="button"
        accessibilityLabel={isHidden ? 'Show balances' : 'Hide balances'}
        hitSlop={8}
      >
        <Image
          source={
            isHidden
              ? require('../../assets/icons/eye.png')
              : require('../../assets/icons/eye.png')
          }
          style={styles.eyeIcon}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#55595B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  greeting: {
    flex: 1,
    marginLeft: spacing.md,
  },
  greetingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  name: {
    ...typography.headerSmall,
    color: colors.text,
  },
  loadingText: {
    flex: 1,
    marginLeft: spacing.md,
    gap: spacing.sm,
  },
  eyeButton: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: { width: 20, height: 20 },
});
