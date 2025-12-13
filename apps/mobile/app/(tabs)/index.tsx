import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useApi } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    categoryLabel: string;
    date: string;
}

interface Summary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
}

export default function DashboardScreen() {
    const { user } = useAuth();
    const { fetchWithAuth } = useApi();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpense: 0, balance: 0 });
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const [txData, summaryData] = await Promise.all([
                fetchWithAuth('/transactions?limit=5'),
                fetchWithAuth('/transactions/summary'),
            ]);
            setTransactions(txData);
            setSummary(summaryData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const formatCurrency = (amount: number) => {
        return `₺${Math.abs(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Günaydın';
        if (hour < 18) return 'İyi günler';
        return 'İyi akşamlar';
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{greeting()} 👋</Text>
                        <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
                    </View>
                    <TouchableOpacity style={styles.notificationBtn}>
                        <Ionicons name="notifications-outline" size={24} color={Colors.gray600} />
                    </TouchableOpacity>
                </View>

                {/* Balance Card */}
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                >
                    <Text style={styles.balanceLabel}>Toplam Bakiye</Text>
                    <Text style={styles.balanceAmount}>{formatCurrency(summary.balance)}</Text>

                    <View style={styles.balanceRow}>
                        <View style={styles.balanceItem}>
                            <View style={[styles.balanceIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Ionicons name="arrow-down" size={16} color={Colors.white} />
                            </View>
                            <View>
                                <Text style={styles.balanceItemLabel}>Gelir</Text>
                                <Text style={styles.balanceItemAmount}>{formatCurrency(summary.totalIncome)}</Text>
                            </View>
                        </View>
                        <View style={styles.balanceItem}>
                            <View style={[styles.balanceIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Ionicons name="arrow-up" size={16} color={Colors.white} />
                            </View>
                            <View>
                                <Text style={styles.balanceItemLabel}>Gider</Text>
                                <Text style={styles.balanceItemAmount}>{formatCurrency(summary.totalExpense)}</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Ionicons name="trending-up" size={24} color={Colors.success} />
                        <Text style={styles.statValue}>+12%</Text>
                        <Text style={styles.statLabel}>Bu ay</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Ionicons name="wallet" size={24} color={Colors.primary} />
                        <Text style={styles.statValue}>{transactions.length}</Text>
                        <Text style={styles.statLabel}>İşlem</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Ionicons name="flag" size={24} color={Colors.warning} />
                        <Text style={styles.statValue}>3</Text>
                        <Text style={styles.statLabel}>Hedef</Text>
                    </Card>
                </View>

                {/* Recent Transactions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Son İşlemler</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>Tümünü Gör</Text>
                    </TouchableOpacity>
                </View>

                <Card variant="outlined" padding="none">
                    {transactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color={Colors.gray300} />
                            <Text style={styles.emptyText}>Henüz işlem yok</Text>
                        </View>
                    ) : (
                        transactions.map((tx, index) => (
                            <TouchableOpacity
                                key={tx.id}
                                style={[
                                    styles.transactionItem,
                                    index !== transactions.length - 1 && styles.transactionBorder,
                                ]}
                            >
                                <View style={[
                                    styles.txIcon,
                                    { backgroundColor: tx.type === 'income' ? Colors.successLight : Colors.dangerLight }
                                ]}>
                                    <Ionicons
                                        name={tx.type === 'income' ? 'arrow-down' : 'arrow-up'}
                                        size={18}
                                        color={tx.type === 'income' ? Colors.success : Colors.danger}
                                    />
                                </View>
                                <View style={styles.txInfo}>
                                    <Text style={styles.txDescription} numberOfLines={1}>{tx.description}</Text>
                                    <Text style={styles.txCategory}>{tx.categoryLabel}</Text>
                                </View>
                                <Text style={[
                                    styles.txAmount,
                                    { color: tx.type === 'income' ? Colors.success : Colors.danger }
                                ]}>
                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    greeting: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
    },
    userName: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.text,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    balanceLabel: {
        fontSize: Typography.sm,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: Spacing.xs,
    },
    balanceAmount: {
        fontSize: Typography['4xl'],
        fontWeight: Typography.bold,
        color: Colors.white,
        marginBottom: Spacing.xl,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    balanceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    balanceIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceItemLabel: {
        fontSize: Typography.xs,
        color: 'rgba(255,255,255,0.7)',
    },
    balanceItemAmount: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.white,
    },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    statValue: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.text,
        marginTop: Spacing.sm,
    },
    statLabel: {
        fontSize: Typography.xs,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.semibold,
        color: Colors.text,
    },
    seeAll: {
        fontSize: Typography.sm,
        color: Colors.primary,
        fontWeight: Typography.medium,
    },
    emptyState: {
        padding: Spacing['3xl'],
        alignItems: 'center',
    },
    emptyText: {
        fontSize: Typography.base,
        color: Colors.gray400,
        marginTop: Spacing.md,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    transactionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray100,
    },
    txIcon: {
        width: 40,
        height: 40,
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
    txCategory: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    txAmount: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
    },
});
