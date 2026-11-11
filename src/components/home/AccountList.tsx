
import React from 'react';
import {
    FlatList,
    StyleSheet,
    View,
} from 'react-native';

import AccountCard from './AccountCard';
import Skeleton from '../common/Skeleton';

import { spacing } from '../../theme';

import type { Account } from '../../types/home';

interface AccountListProps {
    accounts: Account[] | null;
    isLoading: boolean;
    isHidden: boolean;
}

export default function AccountList({
    accounts,
    isLoading,
    isHidden,
}: AccountListProps) {
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Skeleton width={148} height={120} borderRadius={20} />
                <Skeleton width={148} height={120} borderRadius={20} />
            </View>
        );
    }

    return (
        <FlatList
            horizontal
            data={accounts ?? []}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
                <AccountCard
                    account={item}
                    isHidden={isHidden}
                />
            )}
            ItemSeparatorComponent={() => (
                <View style={styles.separator} />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.content}
        />
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    content: {
        paddingRight: spacing.screen,
    },
    separator: {
        width: spacing.md,
    },
});
