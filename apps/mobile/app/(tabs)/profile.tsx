import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface MenuItem {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    subtitle?: string;
    onPress: () => void;
    color?: string;
    badge?: string;
}

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        Alert.alert(
            'Çıkış Yap',
            'Çıkış yapmak istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    }
                },
            ]
        );
    };

    const menuItems: MenuItem[] = [
        {
            icon: 'person-outline',
            label: 'Hesap Bilgileri',
            subtitle: 'İsim, e-posta, şifre',
            onPress: () => Alert.alert('Yakında', 'Bu özellik yakında eklenecek'),
        },
        {
            icon: 'notifications-outline',
            label: 'Bildirimler',
            subtitle: 'Uyarı ve hatırlatıcılar',
            onPress: () => Alert.alert('Yakında', 'Bu özellik yakında eklenecek'),
        },
        {
            icon: 'card-outline',
            label: 'Kredi Kartları',
            subtitle: 'Kartlarınızı yönetin',
            onPress: () => Alert.alert('Yakında', 'Bu özellik yakında eklenecek'),
            badge: 'PRO',
        },
        {
            icon: 'cloud-download-outline',
            label: 'Veri Yedekleme',
            subtitle: 'Verilerinizi güvende tutun',
            onPress: () => Alert.alert('Yakında', 'Bu özellik yakında eklenecek'),
        },
        {
            icon: 'color-palette-outline',
            label: 'Görünüm',
            subtitle: 'Tema ve dil ayarları',
            onPress: () => Alert.alert('Yakında', 'Bu özellik yakında eklenecek'),
        },
        {
            icon: 'help-circle-outline',
            label: 'Yardım & Destek',
            subtitle: 'SSS ve iletişim',
            onPress: () => Alert.alert('Yakında', 'Bu özellik yakında eklenecek'),
        },
        {
            icon: 'star-outline',
            label: 'Premium\'a Geç',
            subtitle: 'Tüm özellikleri aç',
            onPress: () => Alert.alert('Yakında', 'Bu özellik yakında eklenecek'),
            color: Colors.warning,
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.headerCard}
                >
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>

                    <View style={styles.badgeContainer}>
                        <View style={styles.badge}>
                            <Ionicons name="shield-checkmark" size={14} color={Colors.white} />
                            <Text style={styles.badgeText}>Ücretsiz Plan</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>127</Text>
                        <Text style={styles.statLabel}>İşlem</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>3</Text>
                        <Text style={styles.statLabel}>Hedef</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>45</Text>
                        <Text style={styles.statLabel}>Gün</Text>
                    </Card>
                </View>

                {/* Menu Items */}
                <Card variant="outlined" padding="none">
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.menuItem,
                                index !== menuItems.length - 1 && styles.menuItemBorder,
                            ]}
                            onPress={item.onPress}
                        >
                            <View style={[styles.menuIcon, item.color && { backgroundColor: item.color + '20' }]}>
                                <Ionicons
                                    name={item.icon}
                                    size={22}
                                    color={item.color || Colors.gray600}
                                />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                                {item.subtitle && (
                                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                )}
                            </View>
                            {item.badge && (
                                <View style={styles.proBadge}>
                                    <Text style={styles.proBadgeText}>{item.badge}</Text>
                                </View>
                            )}
                            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                        </TouchableOpacity>
                    ))}
                </Card>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>

                {/* Version */}
                <Text style={styles.version}>Versiyon 1.0.0</Text>
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
    headerCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    avatarText: {
        fontSize: Typography['3xl'],
        fontWeight: Typography.bold,
        color: Colors.white,
    },
    userName: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.white,
        marginBottom: Spacing.xs,
    },
    userEmail: {
        fontSize: Typography.sm,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: Spacing.md,
    },
    badgeContainer: {
        flexDirection: 'row',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: BorderRadius.full,
    },
    badgeText: {
        fontSize: Typography.xs,
        color: Colors.white,
        fontWeight: Typography.medium,
    },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    statValue: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.primary,
    },
    statLabel: {
        fontSize: Typography.xs,
        color: Colors.gray500,
        marginTop: Spacing.xs,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray100,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    menuContent: {
        flex: 1,
    },
    menuLabel: {
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.text,
    },
    menuSubtitle: {
        fontSize: Typography.sm,
        color: Colors.gray500,
        marginTop: 2,
    },
    proBadge: {
        backgroundColor: Colors.warning,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        marginRight: Spacing.sm,
    },
    proBadgeText: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.white,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        marginTop: Spacing.lg,
    },
    logoutText: {
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.danger,
    },
    version: {
        textAlign: 'center',
        fontSize: Typography.sm,
        color: Colors.gray400,
        marginTop: Spacing.md,
    },
});
