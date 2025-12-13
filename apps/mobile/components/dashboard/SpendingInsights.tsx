import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface SpendingInsight {
    type: 'warning' | 'tip' | 'achievement';
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}

interface BudgetProgress {
    category: string;
    spent: number;
    limit: number;
    color: string;
}

export function SpendingInsights() {
    const { fetchWithAuth } = useApi();
    const [insights, setInsights] = useState<SpendingInsight[]>([]);
    const [budgets, setBudgets] = useState<BudgetProgress[]>([]);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        // Generate insights based on spending patterns
        setInsights([
            {
                type: 'warning',
                title: 'Yemek Harcaması Yüksek',
                description: 'Bu ay yemek kategorisinde geçen aya göre %25 daha fazla harcadınız.',
                icon: 'warning',
                color: Colors.warning,
            },
            {
                type: 'achievement',
                title: 'Tasarruf Hedefine Ulaştın! 🎉',
                description: 'Bu ay ₺1.500 tasarruf hedefinin %80\'ine ulaştınız.',
                icon: 'trophy',
                color: Colors.success,
            },
            {
                type: 'tip',
                title: 'Akıllı Öneri',
                description: 'Aboneliklerinizi gözden geçirin. 3 aktif aboneliğiniz var.',
                icon: 'bulb',
                color: Colors.secondary,
            },
        ]);

        setBudgets([
            { category: 'Yemek', spent: 850, limit: 1000, color: Colors.warning },
            { category: 'Ulaşım', spent: 320, limit: 500, color: Colors.success },
            { category: 'Alışveriş', spent: 1200, limit: 1000, color: Colors.danger },
            { category: 'Eğlence', spent: 150, limit: 400, color: Colors.success },
        ]);
    };

    const formatCurrency = (amount: number) => {
        return `₺${amount.toLocaleString('tr-TR')}`;
    };

    const getInsightStyle = (type: string) => {
        switch (type) {
            case 'warning':
                return { bg: Colors.warningLight, border: Colors.warning };
            case 'achievement':
                return { bg: Colors.successLight, border: Colors.success };
            case 'tip':
                return { bg: Colors.secondary + '15', border: Colors.secondary };
            default:
                return { bg: Colors.gray100, border: Colors.gray400 };
        }
    };

    return (
        <View style={styles.container}>
            {/* Insights */}
            <Text style={styles.sectionTitle}>📊 Harcama Analizleri</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.insightsScroll}
            >
                {insights.map((insight, index) => {
                    const style = getInsightStyle(insight.type);
                    return (
                        <View
                            key={index}
                            style={[
                                styles.insightCard,
                                { backgroundColor: style.bg, borderLeftColor: style.border },
                            ]}
                        >
                            <Ionicons name={insight.icon} size={24} color={insight.color} />
                            <Text style={styles.insightTitle}>{insight.title}</Text>
                            <Text style={styles.insightDesc}>{insight.description}</Text>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Budget Progress */}
            <Text style={styles.sectionTitle}>💰 Bütçe Durumu</Text>
            <Card>
                {budgets.map((budget, index) => {
                    const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
                    const isOver = budget.spent > budget.limit;

                    return (
                        <View
                            key={index}
                            style={[styles.budgetItem, index !== budgets.length - 1 && styles.budgetBorder]}
                        >
                            <View style={styles.budgetHeader}>
                                <Text style={styles.budgetCategory}>{budget.category}</Text>
                                <Text style={[styles.budgetAmount, isOver && styles.budgetOver]}>
                                    {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                                </Text>
                            </View>
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBg}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: `${percentage}%`,
                                                backgroundColor: isOver ? Colors.danger : budget.color
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.progressText, { color: budget.color }]}>
                                    {Math.round(percentage)}%
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.semibold,
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    insightsScroll: {
        paddingRight: Spacing.lg,
        gap: Spacing.md,
    },
    insightCard: {
        width: width * 0.7,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderLeftWidth: 4,
        marginRight: Spacing.md,
    },
    insightTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.text,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    insightDesc: {
        fontSize: Typography.sm,
        color: Colors.gray600,
        lineHeight: 20,
    },
    budgetItem: {
        paddingVertical: Spacing.md,
    },
    budgetBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray100,
    },
    budgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    budgetCategory: {
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.text,
    },
    budgetAmount: {
        fontSize: Typography.sm,
        color: Colors.gray600,
    },
    budgetOver: {
        color: Colors.danger,
        fontWeight: Typography.semibold,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    progressBg: {
        flex: 1,
        height: 8,
        backgroundColor: Colors.gray100,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: Typography.xs,
        fontWeight: Typography.semibold,
        width: 35,
        textAlign: 'right',
    },
});
