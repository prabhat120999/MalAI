import React, { useCallback, useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  StatusBar,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useHome } from '../hooks/useHome';

import HomeHeader from '../components/home/HomeHeader';
import BalanceSection from '../components/home/BalanceSection';
import AccountList from '../components/home/AccountList';
import TransactionList from '../components/home/TransactionList';
import SuggestionChips from '../components/home/SuggestionChips';
import ChatDock from '../components/home/ChatDock';
import ErrorView from '../components/common/ErrorView';

import { colors, spacing, typography } from '../theme';

import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { me, accounts, transactions, suggestions, refreshAll } = useHome();
  const insets = useSafeAreaInsets();

  const [isHidden, setIsHidden] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await refreshAll();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshAll]);

  const openChat = useCallback(
    (initialMessage?: string) => {
      navigation.navigate('Chat', {
        initialMessage,
        firstName: me.data?.firstName,
      });
    },
    [navigation, me.data?.firstName],
  );

  const handleSuggestion = useCallback(
    (text: string) => {
      openChat(text);
    },
    [openChat],
  );

  const handleChatPress = useCallback(() => {
    openChat();
  }, [openChat]);

  const accountsData = accounts.data?.accounts ?? null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={[
          'rgba(0, 105, 75, 0.28)',
          'rgba(0, 55, 43, 0.12)',
          colors.page,
        ]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <StatusBar barStyle="light-content" />

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      >
        <HomeHeader
          firstName={me.data?.firstName}
          isLoading={me.isLoading && !me.data}
          isHidden={isHidden}
          onToggleBalance={() => setIsHidden(previous => !previous)}
        />

        <BalanceSection
          accounts={accountsData}
          isLoading={accounts.isLoading && !accountsData}
          isHidden={isHidden}
        />

        <View style={styles.accountsSection}>
          {accounts.error && !accountsData ? (
            <ErrorView
              message="Couldn't load your accounts."
              onRetry={accounts.refetch}
            />
          ) : (
            <AccountList
              accounts={accountsData}
              isLoading={accounts.isLoading && !accountsData}
              isHidden={isHidden}
            />
          )}
        </View>

        {me.error && !me.data && (
          <ErrorView
            message="Couldn't load your profile."
            onRetry={me.refetch}
          />
        )}

        <View style={styles.activitySection}>
          <TransactionList
            transactions={transactions.data?.transactions ?? null}
            isLoading={transactions.isLoading && !transactions.data}
            error={transactions.data ? null : transactions.error}
            isHidden={isHidden}
            onRetry={transactions.refetch}
          />
        </View>

        {/* Suggestions intentionally removed from ScrollView */}
      </ScrollView>

      {/* Fixed bottom area */}
      <View
        style={[
          styles.bottomContainer,
          { paddingBottom: Math.max(insets.bottom, spacing.sm) },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(2, 11, 14, 0)',
            'rgba(2, 11, 14, 0.75)',
            'rgba(2, 11, 14, 1)',
          ]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.suggestionsSection}>
          <SuggestionChips
            suggestions={suggestions.data?.suggestions ?? null}
            isLoading={suggestions.isLoading && !suggestions.data}
            onSelect={handleSuggestion}
          />

          {suggestions.error && !suggestions.data && (
            <Pressable onPress={suggestions.refetch}>
              <Text style={styles.retrySuggestions}>Reload suggestions</Text>
            </Pressable>
          )}
        </View>

        <ChatDock onPress={handleChatPress} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: 180,
  },
  accountsSection: {
    marginBottom: spacing.xxl,
  },
  activitySection: {
    marginBottom: spacing.lg,
  },
  suggestionsSection: {
    paddingHorizontal: spacing.screen,
  },
  retrySuggestions: {
    ...typography.body,
    color: colors.brand,
    marginTop: spacing.sm,
  },
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    paddingTop: spacing.xl,
  },
});
