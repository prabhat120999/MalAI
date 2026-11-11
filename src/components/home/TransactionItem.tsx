
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import {
  colors,
  spacing,
  typography,
  radius,
} from '../../theme';

import { formatMoney } from '../../utils/money';

import type { Transaction } from '../../types/home';

interface TransactionItemProps {
  transaction: Transaction;
  isHidden: boolean;
}

const categoryIcons: Record<string, string> = {
  dining: '♜',
  groceries: '🛒',
  transfer: '↔',
  income: '↗',
  transport: '↗',
  shopping: '▣',
  household: '⌂',
  other: '•',
};

const categoryColors: Record<string, string> = {
  dining: colors.categories.dining,
  groceries: colors.categories.groceries,
  transfer: colors.categories.transfer,
  income: colors.categories.income,
  transport: colors.categories.transport,
  shopping: colors.categories.shopping,
  household: colors.categories.household,
  other: colors.categories.other,
};

function getRelativeTime(dateString: string): string {
  const timestamp = new Date(dateString).getTime();

  if (!Number.isFinite(timestamp)) {
    return '';
  }

  const diff = Math.max(0, Date.now() - timestamp);

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  return `${days}d ago`;
}

export default function TransactionItem({
  transaction,
  isHidden,
}: TransactionItemProps) {
  const isCredit = transaction.direction === 'credit';

  const amount = formatMoney({
    ...transaction.amount,
    amountMinor: Math.abs(transaction.amount.amountMinor),
  });

  const category = transaction.category.toLowerCase();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.categoryIcon,
          {
            backgroundColor:
              categoryColors[category] ?? colors.categories.other,
          },
        ]}
      >
        <Text style={styles.icon}>
          {categoryIcons[category] ?? '•'}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.title}
        </Text>

        <Text style={styles.subtitle}>
          {transaction.category.charAt(0).toUpperCase() +
            transaction.category.slice(1)}
          {' · '}
          {getRelativeTime(transaction.createdAt)}
        </Text>
      </View>

      <Text
        style={[
          styles.amount,
          isCredit && styles.credit,
        ]}
        numberOfLines={1}
      >
        {isHidden
          ? '••••••'
          : `${isCredit ? '+' : '-'}${amount}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    color: colors.text,
  },
  details: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...typography.bodyLarge,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  amount: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  credit: {
    color: colors.success,
  },
});
