
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import TransactionItem from './TransactionItem';
import Skeleton from '../common/Skeleton';
import ErrorView from '../common/ErrorView';

import {
  colors,
  spacing,
  typography,
} from '../../theme';

import type { Transaction } from '../../types/home';

interface TransactionListProps {
  transactions: Transaction[] | null;
  isLoading: boolean;
  error: Error | null;
  isHidden: boolean;
  onRetry: () => void;
}

export default function TransactionList({
  transactions,
  isLoading,
  error,
  isHidden,
  onRetry,
}: TransactionListProps) {
  return (
    <View>
      <Text style={styles.heading}>Recent activity</Text>

      {isLoading && (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map(item => (
            <View key={item} style={styles.skeletonRow}>
              <Skeleton width={48} height={48} borderRadius={24} />
              <View style={styles.skeletonDetails}>
                <Skeleton width="70%" height={16} />
                <Skeleton width="40%" height={12} />
              </View>
            </View>
          ))}
        </View>
      )}

      {!isLoading && error && (
        <ErrorView
          message="Couldn't load your activity."
          onRetry={onRetry}
        />
      )}

      {!isLoading && !error && transactions?.length === 0 && (
        <Text style={styles.empty}>No recent activity</Text>
      )}

      {!isLoading && !error && transactions?.map(transaction => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          isHidden={isHidden}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.headerXSmall,
    color: colors.text,
    marginBottom: spacing.md,
  },
  skeletonContainer: {
    gap: spacing.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
  },
  skeletonDetails: {
    flex: 1,
    gap: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    paddingVertical: spacing.lg,
  },
});
