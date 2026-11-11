
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import Skeleton from '../common/Skeleton';

import {
  colors,
  spacing,
  radius,
  typography,
} from '../../theme';

import { formatMoney } from '../../utils/money';

import type { Account } from '../../types/home';

interface AccountCardProps {
  account?: Account;
  isLoading?: boolean;
  isHidden: boolean;
}

export default function AccountCard({
  account,
  isLoading = false,
  isHidden,
}: AccountCardProps) {
  if (isLoading) {
    return (
      <Skeleton
        width={148}
        height={120}
        borderRadius={radius.large}
      />
    );
  }

  if (!account) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>
          {account.type === 'current'
            ? '▤'
            : account.type === 'savings'
              ? '♧'
              : '◇'}
        </Text>
      </View>

      <Text style={styles.accountName} numberOfLines={1}>
        {account.name}
      </Text>

      <Text style={styles.balance} numberOfLines={1}>
        {isHidden
          ? 'AED ••••••'
          : formatMoney(account.balance)}
      </Text>

      <Text style={styles.maskedNumber}>
        {account.maskedNumber}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    height: 120,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: colors.text,
    fontSize: 18,
  },
  accountName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  balance: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.text,
  },
  maskedNumber: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});
