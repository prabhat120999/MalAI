
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import type { TransferDraftWidget } from '../../types/widgets';
import type { WidgetActionState } from '../../context/ChatContext';

import { formatMoney } from '../../utils/money';
import { colors, spacing, radius, typography } from '../../theme';

interface Props {
  widget: TransferDraftWidget;
  actionState?: WidgetActionState;
  onAction: (actionId: string) => void;
}

export default function TransferDraft({
  widget,
  actionState,
  onAction,
}: Props) {
  const isProcessing = actionState?.status === 'processing';
  const isSuccessful = actionState?.status === 'success';
  const hasFailed = actionState?.status === 'error';

  const activeActionId = actionState?.actionId;

  const confirmAction = widget.actions.find(
    action => action.id === 'confirm',
  );

  const cancelAction = widget.actions.find(
    action => action.id === 'cancel',
  );

  const isRetryingSameAction = hasFailed && activeActionId;

  const renderAction = (
    actionId: string,
    label: string,
    variant: 'primary' | 'secondary',
  ) => {
    const isActive = activeActionId === actionId;

    const disabled =
      isProcessing ||
      isSuccessful ||
      (hasFailed && !isActive);

    return (
      <Pressable
        key={actionId}
        style={[
          styles.actionButton,
          variant === 'primary'
            ? styles.primaryButton
            : styles.secondaryButton,
          disabled && styles.disabledButton,
        ]}
        disabled={disabled}
        onPress={() => onAction(actionId)}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        {isProcessing && isActive ? (
          <ActivityIndicator color={colors.page} />
        ) : (
          <Text
            style={[
              styles.actionText,
              variant === 'secondary' && styles.secondaryActionText,
            ]}
          >
            {hasFailed && isActive ? 'Retry' : label}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transfer draft</Text>

      <Text style={styles.label}>Recipient</Text>
      <Text style={styles.value}>{widget.to.name}</Text>
      <Text style={styles.account}>{widget.to.maskedIban}</Text>

      <View style={styles.divider} />

      <Text style={styles.label}>Transfer amount</Text>
      <Text style={styles.amount}>
        {formatMoney(widget.amount)}
      </Text>

      <Text style={styles.disclaimer}>
        Review the details before confirming this transfer.
      </Text>

      {actionState?.message ? (
        <Text
          style={[
            styles.statusMessage,
            hasFailed && styles.errorMessage,
          ]}
        >
          {actionState.message}
        </Text>
      ) : null}

      {!isSuccessful && (
        <View style={styles.actions}>
          {confirmAction &&
            renderAction(
              confirmAction.id,
              confirmAction.label,
              'primary',
            )}

          {cancelAction &&
            renderAction(
              cancelAction.id,
              cancelAction.label,
              'secondary',
            )}
        </View>
      )}

      {isSuccessful && (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>
            {activeActionId === 'confirm'
              ? '✓ Transfer confirmed'
              : 'Transfer cancelled'}
          </Text>
        </View>
      )}
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
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  account: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  amount: {
    ...typography.headerSmall,
    color: colors.brand,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.large,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.brand,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionText: {
    ...typography.body,
    color: colors.page,
    fontWeight: '700',
  },
  secondaryActionText: {
    color: colors.text,
  },
  statusMessage: {
    ...typography.caption,
    color: colors.brand,
    marginTop: spacing.md,
  },
  errorMessage: {
    color: '#FF7777',
  },
  completedContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.large,
    backgroundColor: 'rgba(22, 214, 155, 0.12)',
  },
  completedText: {
    ...typography.body,
    color: colors.brand,
    fontWeight: '600',
    textAlign: 'center',
  },
});
