
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { SpendingSummaryWidget } from '../../types/widgets';
import { formatMoney } from '../../utils/money';
import { colors, spacing, radius, typography } from '../../theme';

interface Props {
  widget: SpendingSummaryWidget;
}

export default function SpendingSummary({ widget }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{widget.title}</Text>

      <Text style={styles.label}>Total spent</Text>
      <Text style={styles.total}>
        {formatMoney(widget.total)}
      </Text>

      <Text style={styles.change}>
        {widget.changePercent > 0 ? '+' : ''}
        {widget.changePercent}% compared to last month
      </Text>

      <View style={styles.divider} />

      {widget.items.map(item => (
        <View key={item.label} style={styles.item}>
          <Text style={styles.itemLabel}>{item.label}</Text>
          <Text style={styles.itemAmount}>
            {formatMoney(item.amount)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.headerXSmall,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  total: {
    ...typography.headerSmall,
    color: colors.text,
    marginTop: spacing.xs,
  },
  change: {
    ...typography.caption,
    color: colors.brand,
    marginTop: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  itemLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  itemAmount: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});
