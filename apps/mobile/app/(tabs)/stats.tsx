import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface CategorySummary {
    category: string;
    amount: number;
    percentage: number;
    color: string;
}

export default function StatsScreen() {
    const { fetchWithAuth } = useApi();
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
    const [categories, setCategories] = useState<CategorySummary[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await fetchWithAuth('/transactions/summary');
            setSummary(data);

            // Mock category data - in real app, get from API
            setCategories([
                { category: 'Yemek', amount: 1250, percentage: 35, color: '#F59E0B' },
                { category: 'Ulaşım', amount: 850, percentage: 24, color: '#3B82F6' },
                { category: 'Alışveriş', amount: 650, percentage: 18, color: '#EC4899' },
                { category: 'Faturalar', amount: 500, percentage: 14, color: '#EF4444' },
                { category: 'Diğer', amount: 320, percentage: 9, color: '#6B7280' },
            ]);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        return `₺${Math.abs(amount).toLocaleString('tr-TR')}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>İstatistikler</Text>

                {/* Monthly Summary Cards */}
                <View style={styles.summaryRow}>
                    <Card style={[styles.summaryCard, { backgroundColor: Colors.successLight }]}>
                        <Ionicons name="arrow-down-circle" size={28} color={Colors.success} />
                        <Text style={styles.summaryLabel}>Gelir</Text>
                        <Text style={[styles.summaryAmount, { color: Colors.success }]}>
                            {formatCurrency(summary.totalIncome)}
                        </Text>
                    </Card>
                    <Card style={[styles.summaryCard, { backgroundColor: Colors.dangerLight }]}>
                        <Ionicons name="arrow-up-circle" size={28} color={Colors.danger} />
                        <Text style={styles.summaryLabel}>Gider</Text>
                        <Text style={[styles.summaryAmount, { color: Colors.danger }]}>
                            {formatCurrency(summary.totalExpense)}
                        </Text>
                    </Card>
                </View>

                {/* Savings Rate */}
                <Card style={styles.savingsCard}>
                    <View style={styles.savingsHeader}>
                        <Text style={styles.savingsTitle}>Tasarruf Oranı</Text>
                        <Text style={styles.savingsPercentage}>
                            {summary.totalIncome > 0
                                ? Math.round((summary.balance / summary.totalIncome) * 100)
                                : 0}%
                        </Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${Math.max(0, Math.min(100, (summary.balance / (summary.totalIncome || 1)) * 100))}%`,
                                    backgroundColor: summary.balance >= 0 ? Colors.success : Colors.danger
                                }
                            ]}
                        />
                    </View>
                    <Text style={styles.savingsHint}>
                        {summary.balance >= 0
                            ? `Bu ay ${formatCurrency(summary.balance)} biriktirdiniz!`
                            : `Bu ay ${formatCurrency(Math.abs(summary.balance))} fazla harcadınız`}
                    </Text>
                </Card>

                {/* Category Breakdown */}
                <Text style={styles.sectionTitle}>Kategori Dağılımı</Text>

                {categories.map((cat, index) => (
                    <Card key={index} style={styles.categoryCard}>
                        <View style={styles.categoryHeader}>
                            <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                            <Text style={styles.categoryName}>{cat.category}</Text>
                            <Text style={styles.categoryAmount}>{formatCurrency(cat.amount)}</Text>
                        </View>
                        <View style={styles.categoryBarContainer}>
                            <View
                                style={[
                                    styles.categoryBar,
                                    { width: `${cat.percentage}%`, backgroundColor: cat.color }
                                ]}
                            />
                        </View>
                        <Text style={styles.categoryPercentage}>{cat.percentage}%</Text>
                    </Card>
                ))}

                {/* Tips */}
                <Card style={styles.tipCard}>
                    <Ionicons name="bulb" size={24} color={Colors.warning} />
                    <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>Tasarruf İpucu</Text>
                        <Text style={styles.tipText}>
                            Yemek kategorisinde harcamalarınızı %10 azaltarak ayda ₺125 tasarruf edebilirsiniz.
                        </Text>
                    </View>
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
    content: {
        padding: Spacing.lg,
    },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: Typography.bold,
        color: Colors.text,
        marginBottom: Spacing.xl,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    summaryCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    summaryLabel: {
        fontSize: Typography.sm,
        color: Colors.gray600,
        marginTop: Spacing.sm,
    },
    summaryAmount: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        marginTop: Spacing.xs,
    },
    savingsCard: {
        marginBottom: Spacing.xl,
    },
    savingsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    savingsTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.text,
    },
    savingsPercentage: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    progressBar: {
        height: 8,
        backgroundColor: Colors.gray200,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    savingsHint: {
        fontSize: Typography.sm,
        color: Colors.gray500,
    },
    sectionTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.semibold,
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    categoryCard: {
        marginBottom: Spacing.sm,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    categoryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: Spacing.sm,
    },
    categoryName: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.text,
    },
    categoryAmount: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.text,
    },
    categoryBarContainer: {
        height: 6,
        backgroundColor: Colors.gray100,
        borderRadius: 3,
        marginBottom: Spacing.xs,
    },
    categoryBar: {
        height: '100%',
        borderRadius: 3,
    },
    categoryPercentage: {
        fontSize: Typography.xs,
        color: Colors.gray500,
        textAlign: 'right',
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        marginTop: Spacing.lg,
        backgroundColor: Colors.warningLight,
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.gray800,
        marginBottom: Spacing.xs,
    },
    tipText: {
        fontSize: Typography.sm,
        color: Colors.gray600,
        lineHeight: 20,
    },
});
