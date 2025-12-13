import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface QuickAction {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    route: string;
    colors: [string, string];
}

const QUICK_ACTIONS: QuickAction[] = [
    {
        icon: 'add-circle',
        label: 'Gelir Ekle',
        route: '/(tabs)/add?type=income',
        colors: [Colors.success, Colors.successDark],
    },
    {
        icon: 'remove-circle',
        label: 'Gider Ekle',
        route: '/(tabs)/add?type=expense',
        colors: [Colors.danger, Colors.dangerDark],
    },
    {
        icon: 'document-text',
        label: 'PDF Yükle',
        route: '/(tabs)/upload',
        colors: [Colors.primary, Colors.primaryDark],
    },
    {
        icon: 'flag',
        label: 'Hedef Koy',
        route: '/(tabs)/goals',
        colors: [Colors.warning, '#D97706'],
    },
];

export function QuickActions() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>⚡ Hızlı İşlemler</Text>
            <View style={styles.grid}>
                {QUICK_ACTIONS.map((action, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.actionButton}
                        onPress={() => router.push(action.route as any)}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={action.colors}
                            style={styles.actionGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name={action.icon} size={28} color={Colors.white} />
                        </LinearGradient>
                        <Text style={styles.actionLabel}>{action.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: Spacing.lg,
    },
    title: {
        fontSize: Typography.lg,
        fontWeight: Typography.semibold,
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    actionButton: {
        width: '22%',
        alignItems: 'center',
    },
    actionGradient: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    actionLabel: {
        fontSize: Typography.xs,
        color: Colors.gray600,
        textAlign: 'center',
    },
});
