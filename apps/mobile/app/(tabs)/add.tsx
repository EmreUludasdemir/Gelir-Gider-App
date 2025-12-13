import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const CATEGORIES = [
    { id: 'food', label: 'Yemek', icon: 'fast-food', color: '#F59E0B' },
    { id: 'transport', label: 'Ulaşım', icon: 'car', color: '#3B82F6' },
    { id: 'shopping', label: 'Alışveriş', icon: 'cart', color: '#EC4899' },
    { id: 'entertainment', label: 'Eğlence', icon: 'game-controller', color: '#8B5CF6' },
    { id: 'bills', label: 'Faturalar', icon: 'receipt', color: '#EF4444' },
    { id: 'health', label: 'Sağlık', icon: 'medical', color: '#10B981' },
    { id: 'salary', label: 'Maaş', icon: 'wallet', color: '#22C55E' },
    { id: 'other', label: 'Diğer', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

export default function AddTransactionScreen() {
    const { fetchWithAuth } = useApi();
    const router = useRouter();

    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('other');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || !description) {
            Alert.alert('Hata', 'Tutar ve açıklama gereklidir');
            return;
        }

        const numAmount = parseFloat(amount.replace(',', '.'));
        if (isNaN(numAmount) || numAmount <= 0) {
            Alert.alert('Hata', 'Geçerli bir tutar girin');
            return;
        }

        setLoading(true);
        try {
            await fetchWithAuth('/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    amount: numAmount,
                    description,
                    type,
                    categoryId: category,
                    categoryLabel: CATEGORIES.find(c => c.id === category)?.label || 'Diğer',
                    date: new Date().toISOString(),
                    source: 'manual',
                    tags: '',
                }),
            });

            Alert.alert('Başarılı', 'İşlem eklendi', [
                { text: 'Tamam', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Hata', 'İşlem eklenemedi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <Text style={styles.title}>Yeni İşlem</Text>

                    {/* Type Toggle */}
                    <View style={styles.typeToggle}>
                        <TouchableOpacity
                            style={[styles.typeButton, type === 'expense' && styles.typeButtonExpense]}
                            onPress={() => setType('expense')}
                        >
                            <Ionicons
                                name="arrow-up"
                                size={20}
                                color={type === 'expense' ? Colors.white : Colors.danger}
                            />
                            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>
                                Gider
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeButton, type === 'income' && styles.typeButtonIncome]}
                            onPress={() => setType('income')}
                        >
                            <Ionicons
                                name="arrow-down"
                                size={20}
                                color={type === 'income' ? Colors.white : Colors.success}
                            />
                            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>
                                Gelir
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Amount Input */}
                    <Card style={styles.amountCard}>
                        <Text style={styles.currencySymbol}>₺</Text>
                        <Input
                            placeholder="0,00"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                            style={styles.amountInput}
                        />
                    </Card>

                    {/* Description */}
                    <Input
                        label="Açıklama"
                        placeholder="Ne için harcadınız?"
                        icon="document-text"
                        value={description}
                        onChangeText={setDescription}
                    />

                    {/* Category */}
                    <Text style={styles.sectionLabel}>Kategori</Text>
                    <View style={styles.categoryGrid}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryItem,
                                    category === cat.id && { borderColor: cat.color, borderWidth: 2 }
                                ]}
                                onPress={() => setCategory(cat.id)}
                            >
                                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                                    <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                                </View>
                                <Text style={styles.categoryLabel}>{cat.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Submit Button */}
                    <Button
                        title="İşlem Ekle"
                        onPress={handleSubmit}
                        loading={loading}
                        style={styles.submitButton}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
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
    typeToggle: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.gray200,
    },
    typeButtonExpense: {
        backgroundColor: Colors.danger,
        borderColor: Colors.danger,
    },
    typeButtonIncome: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    typeText: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.gray600,
    },
    typeTextActive: {
        color: Colors.white,
    },
    amountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    currencySymbol: {
        fontSize: Typography['3xl'],
        fontWeight: Typography.bold,
        color: Colors.gray400,
        marginRight: Spacing.sm,
    },
    amountInput: {
        fontSize: Typography['3xl'],
        fontWeight: Typography.bold,
        flex: 1,
    },
    sectionLabel: {
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.gray700,
        marginBottom: Spacing.md,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    categoryItem: {
        width: '23%',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.gray200,
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    categoryLabel: {
        fontSize: Typography.xs,
        color: Colors.gray600,
        textAlign: 'center',
    },
    submitButton: {
        marginTop: Spacing.lg,
    },
});
