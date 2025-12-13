import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface Subscription {
    id: string;
    name: string;
    amount: number;
    frequency: 'weekly' | 'monthly' | 'yearly';
    category: string;
    nextPayment: string;
    isActive: boolean;
    totalSpentYear: number;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Eğlence': 'tv',
    'Teknoloji': 'laptop',
    'İş': 'briefcase',
    'Sağlık': 'fitness',
    'Faturalar': 'receipt',
    'Diğer': 'apps',
};

export default function SubscriptionsScreen() {
    const { fetchWithAuth } = useApi();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [totalMonthly, setTotalMonthly] = useState(0);
    const [totalYearly, setTotalYearly] = useState(0);

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = async () => {
        try {
            const data = await fetchWithAuth('/subscriptions');
            setSubscriptions(data.subscriptions || []);
            setTotalMonthly(data.totalMonthly || 0);
            setTotalYearly(data.totalYearly || 0);
        } catch (error) {
            // Mock data
            setSubscriptions([
                { id: '1', name: 'Netflix', amount: 149.99, frequency: 'monthly', category: 'Eğlence', nextPayment: '2024-12-20', isActive: true, totalSpentYear: 1799.88 },
                { id: '2', name: 'Spotify', amount: 59.99, frequency: 'monthly', category: 'Eğlence', nextPayment: '2024-12-15', isActive: true, totalSpentYear: 719.88 },
                { id: '3', name: 'YouTube Premium', amount: 79.99, frequency: 'monthly', category: 'Eğlence', nextPayment: '2024-12-18', isActive: true, totalSpentYear: 959.88 },
                { id: '4', name: 'iCloud 200GB', amount: 44.99, frequency: 'monthly', category: 'Teknoloji', nextPayment: '2024-12-22', isActive: true, totalSpentYear: 539.88 },
                { id: '5', name: 'Spor Salonu', amount: 299, frequency: 'monthly', category: 'Sağlık', nextPayment: '2024-12-25', isActive: true, totalSpentYear: 3588 },
            ]);
            setTotalMonthly(633.96);
            setTotalYearly(7607.52);
        }
    };

    const formatCurrency = (amount: number) => `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'weekly': return 'Haftalık';
            case 'monthly': return 'Aylık';
            case 'yearly': return 'Yıllık';
            default: return freq;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Eğlence': return '#E11D48';
            case 'Teknoloji': return '#3B82F6';
            case 'İş': return '#8B5CF6';
            case 'Sağlık': return '#10B981';
            case 'Faturalar': return '#F59E0B';
            default: return Colors.gray500;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Abonelikler</Text>
                <Text style={styles.subtitle}>
                    Otomatik tespit edilen tekrarlayan ödemeler
                </Text>

                {/* Summary Card */}
                <LinearGradient
                    colors={['#E11D48', '#BE123C']}
                    style={styles.summaryCard}
                >
                    <View style={styles.summaryRow}>
                        <View>
                            <Text style={styles.summaryLabel}>Aylık Toplam</Text>
                            <Text style={styles.summaryAmount}>{formatCurrency(totalMonthly)}</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View>
                            <Text style={styles.summaryLabel}>Yıllık Toplam</Text>
                            <Text style={styles.summaryAmount}>{formatCurrency(totalYearly)}</Text>
                        </View>
                    </View>
                    <View style={styles.activeCount}>
                        <Ionicons name="repeat" size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.activeCountText}>
                            {subscriptions.filter(s => s.isActive).length} aktif abonelik
                        </Text>
                    </View>
                </LinearGradient>

                {/* Upcoming Payments */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📅 Yaklaşan Ödemeler</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {subscriptions
                            .filter(s => s.isActive)
                            .sort((a, b) => new Date(a.nextPayment).getTime() - new Date(b.nextPayment).getTime())
                            .slice(0, 4)
                            .map((sub) => (
                                <View key={sub.id} style={styles.upcomingCard}>
                                    <View style={[styles.upcomingIcon, { backgroundColor: getCategoryColor(sub.category) + '20' }]}>
                                        <Ionicons
                                            name={CATEGORY_ICONS[sub.category] || 'apps'}
                                            size={20}
                                            color={getCategoryColor(sub.category)}
                                        />
                                    </View>
                                    <Text style={styles.upcomingName}>{sub.name}</Text>
                                    <Text style={styles.upcomingDate}>{formatDate(sub.nextPayment)}</Text>
                                    <Text style={styles.upcomingAmount}>{formatCurrency(sub.amount)}</Text>
                                </View>
                            ))}
                    </ScrollView>
                </View>

                {/* All Subscriptions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💳 Tüm Abonelikler</Text>

                    {subscriptions.map((sub) => (
                        <Card key={sub.id} style={styles.subscriptionCard}>
                            <View style={[styles.subIcon, { backgroundColor: getCategoryColor(sub.category) + '15' }]}>
                                <Ionicons
                                    name={CATEGORY_ICONS[sub.category] || 'apps'}
                                    size={24}
                                    color={getCategoryColor(sub.category)}
                                />
                            </View>
                            <View style={styles.subInfo}>
                                <Text style={styles.subName}>{sub.name}</Text>
                                <Text style={styles.subMeta}>
                                    {getFrequencyLabel(sub.frequency)} • {sub.category}
                                </Text>
                            </View>
                            <View style={styles.subAmount}>
                                <Text style={styles.subAmountText}>{formatCurrency(sub.amount)}</Text>
                                <Text style={styles.subYearlyText}>
                                    {formatCurrency(sub.totalSpentYear)}/yıl
                                </Text>
                            </View>
                        </Card>
                    ))}
                </View>

                {/* Tips */}
                <Card style={styles.tipCard}>
                    <Ionicons name="bulb" size={24} color={Colors.warning} />
                    <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>Tasarruf İpucu</Text>
                        <Text style={styles.tipText}>
                            Eğlence kategorisinde aylık ₺{(289.97).toFixed(2)} harcıyorsunuz.
                            Bazı abonelikleri değerlendirin.
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
    },
    subtitle: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
    },
    summaryCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.xl,
        marginBottom: Spacing.md,
    },
    summaryDivider: {
        width: 1,
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    summaryLabel: {
        fontSize: Typography.sm,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    summaryAmount: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.white,
        textAlign: 'center',
    },
    activeCount: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    activeCountText: {
        fontSize: Typography.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.semibold,
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    upcomingCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginRight: Spacing.md,
        width: 120,
        alignItems: 'center',
    },
    upcomingIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    upcomingName: {
        fontSize: Typography.sm,
        fontWeight: Typography.medium,
        color: Colors.text,
    },
    upcomingDate: {
        fontSize: Typography.xs,
        color: Colors.gray500,
        marginTop: 2,
    },
    upcomingAmount: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.danger,
        marginTop: Spacing.xs,
    },
    subscriptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    subIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    subName: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.text,
    },
    subMeta: {
        fontSize: Typography.sm,
        color: Colors.gray500,
        marginTop: 2,
    },
    subAmount: {
        alignItems: 'flex-end',
    },
    subAmountText: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.danger,
    },
    subYearlyText: {
        fontSize: Typography.xs,
        color: Colors.gray500,
        marginTop: 2,
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
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
