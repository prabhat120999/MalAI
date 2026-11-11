
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import Skeleton from '../common/Skeleton';

import {
  colors,
  spacing,
  typography,
} from '../../theme';

import { formatMoney, calculateTotalBalance } from '../../utils/money';
import type { Account } from '../../types/home';

interface BalanceSectionProps {
  accounts: Account[] | null;
  isLoading: boolean;
  isHidden: boolean;
}

export default function BalanceSection({
  accounts,
  isLoading,
  isHidden,
}: BalanceSectionProps) {
  const totalBalance = accounts
    ? calculateTotalBalance(accounts)
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Total balance</Text>

      {isLoading ? (
        <Skeleton width={245} height={42} />
      ) : (
        <Text style={styles.amount}>
          {isHidden
            ? 'AED ••••••'
            : totalBalance
              ? formatMoney(totalBalance)
              : 'AED —'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  amount: {
    ...typography.headerLarge,
    color: colors.text,
  },
});
