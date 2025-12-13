import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Modal,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    color: string;
    icon: string;
}

const GOAL_ICONS = [
    { icon: 'car', label: 'Araba', color: '#3B82F6' },
    { icon: 'home', label: 'Ev', color: '#10B981' },
    { icon: 'airplane', label: 'Tatil', color: '#F59E0B' },
    { icon: 'phone-portrait', label: 'Telefon', color: '#8B5CF6' },
    { icon: 'school', label: 'Eğitim', color: '#EC4899' },
    { icon: 'medical', label: 'Sağlık', color: '#EF4444' },
    { icon: 'gift', label: 'Hediye', color: '#06B6D4' },
    { icon: 'wallet', label: 'Acil Durum', color: '#84CC16' },
];

export default function GoalsScreen() {
    const { fetchWithAuth } = useApi();
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newGoal, setNewGoal] = useState({
        name: '',
        targetAmount: '',
        deadline: '',
        selectedIcon: 0,
    });

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            const data = await fetchWithAuth('/savings-goals');
            setGoals(data);
        } catch (error) {
            // Use mock data
            setGoals([
                {
                    id: '1',
                    name: 'Yeni Laptop',
                    targetAmount: 25000,
                    currentAmount: 18500,
                    deadline: '2024-03-01',
                    color: '#8B5CF6',
                    icon: 'laptop',
                },
                {
                    id: '2',
                    name: 'Tatil Fonu',
                    targetAmount: 15000,
                    currentAmount: 6200,
                    deadline: '2024-06-01',
                    color: '#F59E0B',
                    icon: 'airplane',
                },
                {
                    id: '3',
                    name: 'Acil Durum',
                    targetAmount: 30000,
                    currentAmount: 12000,
                    deadline: '2024-12-31',
                    color: '#10B981',
                    icon: 'shield',
                },
            ]);
        }
    };

    const handleAddGoal = async () => {
        if (!newGoal.name || !newGoal.targetAmount) {
            Alert.alert('Hata', 'Hedef adı ve tutar gereklidir');
            return;
        }

        try {
            await fetchWithAuth('/savings-goals', {
                method: 'POST',
                body: JSON.stringify({
                    name: newGoal.name,
                    targetAmount: parseFloat(newGoal.targetAmount),
                    deadline: newGoal.deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                }),
            });
            setModalVisible(false);
            setNewGoal({ name: '', targetAmount: '', deadline: '', selectedIcon: 0 });
            loadGoals();
        } catch (error) {
            Alert.alert('Hata', 'Hedef eklenemedi');
        }
    };

    const formatCurrency = (amount: number) => {
        return `₺${amount.toLocaleString('tr-TR')}`;
    };

    const getTotalProgress = () => {
        const total = goals.reduce((sum, g) => sum + g.targetAmount, 0);
        const current = goals.reduce((sum, g) => sum + g.currentAmount, 0);
        return total > 0 ? (current / total) * 100 : 0;
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Tasarruf Hedefleri</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={24} color={Colors.white} />
                    </TouchableOpacity>
                </View>

                {/* Total Progress Card */}
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.totalCard}
                >
                    <Text style={styles.totalLabel}>Toplam İlerleme</Text>
                    <Text style={styles.totalPercentage}>{Math.round(getTotalProgress())}%</Text>
                    <View style={styles.totalProgress}>
                        <View
                            style={[styles.totalProgressFill, { width: `${getTotalProgress()}%` }]}
                        />
                    </View>
                    <Text style={styles.totalHint}>
                        {goals.length} hedef aktif
                    </Text>
                </LinearGradient>

                {/* Goals List */}
                {goals.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Ionicons name="flag-outline" size={64} color={Colors.gray300} />
                        <Text style={styles.emptyTitle}>Henüz hedef yok</Text>
                        <Text style={styles.emptyText}>
                            Tasarruf hedefi ekleyerek paranızı daha iyi yönetin
                        </Text>
                        <Button
                            title="İlk Hedefini Ekle"
                            onPress={() => setModalVisible(true)}
                            style={styles.emptyButton}
                        />
                    </Card>
                ) : (
                    goals.map((goal) => {
                        const progress = (goal.currentAmount / goal.targetAmount) * 100;
                        const remaining = goal.targetAmount - goal.currentAmount;
                        const daysLeft = Math.max(
                            0,
                            Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        );

                        return (
                            <Card key={goal.id} style={styles.goalCard}>
                                <View style={styles.goalHeader}>
                                    <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
                                        <Ionicons name={goal.icon as any} size={24} color={goal.color} />
                                    </View>
                                    <View style={styles.goalInfo}>
                                        <Text style={styles.goalName}>{goal.name}</Text>
                                        <Text style={styles.goalDeadline}>
                                            {daysLeft > 0 ? `${daysLeft} gün kaldı` : 'Süre doldu'}
                                        </Text>
                                    </View>
                                    <Text style={styles.goalPercentage}>{Math.round(progress)}%</Text>
                                </View>

                                <View style={styles.goalProgress}>
                                    <View
                                        style={[
                                            styles.goalProgressFill,
                                            { width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color },
                                        ]}
                                    />
                                </View>

                                <View style={styles.goalFooter}>
                                    <Text style={styles.goalCurrent}>
                                        {formatCurrency(goal.currentAmount)}
                                    </Text>
                                    <Text style={styles.goalRemaining}>
                                        Kalan: {formatCurrency(remaining)}
                                    </Text>
                                </View>

                                <View style={styles.goalActions}>
                                    <TouchableOpacity style={styles.goalActionBtn}>
                                        <Ionicons name="add-circle" size={20} color={Colors.success} />
                                        <Text style={[styles.goalActionText, { color: Colors.success }]}>
                                            Para Ekle
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.goalActionBtn}>
                                        <Ionicons name="create" size={20} color={Colors.gray500} />
                                        <Text style={styles.goalActionText}>Düzenle</Text>
                                    </TouchableOpacity>
                                </View>
                            </Card>
                        );
                    })
                )}

                {/* Tips */}
                <Card style={styles.tipCard}>
                    <Ionicons name="bulb" size={20} color={Colors.warning} />
                    <Text style={styles.tipText}>
                        Düzenli olarak küçük miktarlar ayırmak, büyük hedeflere ulaşmanın en etkili yoludur.
                    </Text>
                </Card>
            </ScrollView>

            {/* Add Goal Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Yeni Hedef</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.gray600} />
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Hedef Adı"
                            placeholder="Örn: Yeni Araba"
                            value={newGoal.name}
                            onChangeText={(text) => setNewGoal({ ...newGoal, name: text })}
                        />

                        <Input
                            label="Hedef Tutar"
                            placeholder="25000"
                            keyboardType="numeric"
                            value={newGoal.targetAmount}
                            onChangeText={(text) => setNewGoal({ ...newGoal, targetAmount: text })}
                        />

                        <Text style={styles.iconLabel}>İkon Seç</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.iconGrid}>
                                {GOAL_ICONS.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.iconOption,
                                            newGoal.selectedIcon === index && {
                                                borderColor: item.color,
                                                backgroundColor: item.color + '20',
                                            },
                                        ]}
                                        onPress={() => setNewGoal({ ...newGoal, selectedIcon: index })}
                                    >
                                        <Ionicons name={item.icon as any} size={24} color={item.color} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <Button
                            title="Hedef Oluştur"
                            onPress={handleAddGoal}
                            style={styles.modalButton}
                        />
                    </View>
                </View>
            </Modal>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: Typography.bold,
        color: Colors.text,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    totalCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    totalLabel: {
        fontSize: Typography.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    totalPercentage: {
        fontSize: Typography['4xl'],
        fontWeight: Typography.bold,
        color: Colors.white,
        marginVertical: Spacing.sm,
    },
    totalProgress: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        marginBottom: Spacing.sm,
    },
    totalProgressFill: {
        height: '100%',
        backgroundColor: Colors.white,
        borderRadius: 4,
    },
    totalHint: {
        fontSize: Typography.sm,
        color: 'rgba(255,255,255,0.7)',
    },
    emptyCard: {
        alignItems: 'center',
        paddingVertical: Spacing['4xl'],
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
        textAlign: 'center',
        marginTop: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    emptyButton: {
        paddingHorizontal: Spacing['2xl'],
    },
    goalCard: {
        marginBottom: Spacing.md,
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    goalIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    goalInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    goalName: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.text,
    },
    goalDeadline: {
        fontSize: Typography.sm,
        color: Colors.gray500,
        marginTop: 2,
    },
    goalPercentage: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    goalProgress: {
        height: 8,
        backgroundColor: Colors.gray100,
        borderRadius: 4,
        marginBottom: Spacing.md,
    },
    goalProgressFill: {
        height: '100%',
        borderRadius: 4,
    },
    goalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    goalCurrent: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.text,
    },
    goalRemaining: {
        fontSize: Typography.sm,
        color: Colors.gray500,
    },
    goalActions: {
        flexDirection: 'row',
        gap: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.gray100,
        paddingTop: Spacing.md,
    },
    goalActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    goalActionText: {
        fontSize: Typography.sm,
        color: Colors.gray500,
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        marginTop: Spacing.lg,
        backgroundColor: Colors.warningLight,
    },
    tipText: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.gray700,
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: BorderRadius['2xl'],
        borderTopRightRadius: BorderRadius['2xl'],
        padding: Spacing.xl,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    modalTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.text,
    },
    iconLabel: {
        fontSize: Typography.sm,
        fontWeight: Typography.medium,
        color: Colors.gray700,
        marginBottom: Spacing.sm,
    },
    iconGrid: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    iconOption: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.gray100,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    modalButton: {
        marginTop: Spacing.md,
    },
});
