import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    categoryLabel: string;
    date: string;
}

export default function TransactionsScreen() {
    const { fetchWithAuth } = useApi();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [refreshing, setRefreshing] = useState(false);

    const loadTransactions = async () => {
        try {
            const data = await fetchWithAuth('/transactions');
            setTransactions(data);
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    const filteredTransactions = filter === 'all'
        ? transactions
        : transactions.filter(t => t.type === filter);

    const formatCurrency = (amount: number) => {
        return `₺${Math.abs(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    const renderTransaction = ({ item }: { item: Transaction }) => (
        <TouchableOpacity style={styles.transactionItem}>
            <View style={[
                styles.txIcon,
                { backgroundColor: item.type === 'income' ? Colors.successLight : Colors.dangerLight }
            ]}>
                <Ionicons
                    name={item.type === 'income' ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color={item.type === 'income' ? Colors.success : Colors.danger}
                />
            </View>
            <View style={styles.txInfo}>
                <Text style={styles.txDescription} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.txMeta}>{item.categoryLabel} • {formatDate(item.date)}</Text>
            </View>
            <Text style={[
                styles.txAmount,
                { color: item.type === 'income' ? Colors.success : Colors.danger }
            ]}>
                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>İşlemler</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {(['all', 'income', 'expense'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterTab, filter === f && styles.filterTabActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === 'all' ? 'Tümü' : f === 'income' ? 'Gelir' : 'Gider'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Transactions List */}
            <FlatList
                data={filteredTransactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={loadTransactions} colors={[Colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color={Colors.gray300} />
                        <Text style={styles.emptyTitle}>İşlem bulunamadı</Text>
                        <Text style={styles.emptyText}>
                            {filter === 'all'
                                ? 'Henüz işlem eklemediniz'
                                : filter === 'income'
                                    ? 'Gelir işlemi yok'
                                    : 'Gider işlemi yok'}
                        </Text>
                    </View>
                }
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        padding: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: Typography.bold,
        color: Colors.text,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    filterTab: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.gray100,
    },
    filterTabActive: {
        backgroundColor: Colors.primary,
    },
    filterText: {
        fontSize: Typography.sm,
        fontWeight: Typography.medium,
        color: Colors.gray600,
    },
    filterTextActive: {
        color: Colors.white,
    },
    listContent: {
        padding: Spacing.lg,
        paddingTop: 0,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
    },
    separator: {
        height: Spacing.sm,
    },
    txIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    txInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    txDescription: {
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.text,
    },
    txMeta: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    txAmount: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing['5xl'],
    },
    emptyTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.semibold,
        color: Colors.gray600,
        marginTop: Spacing.lg,
    },
    emptyText: {
        fontSize: Typography.base,
        color: Colors.gray400,
        marginTop: Spacing.sm,
    },
});
