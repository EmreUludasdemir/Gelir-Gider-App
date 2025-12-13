import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    xpReward: number;
    unlocked: boolean;
}

interface UserStats {
    totalXP: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    levelProgress: {
        current: number;
        needed: number;
        progress: number;
    };
}

export default function AchievementsScreen() {
    const { fetchWithAuth } = useApi();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsData, achievementsData] = await Promise.all([
                fetchWithAuth('/gamification/stats'),
                fetchWithAuth('/gamification/achievements'),
            ]);
            setStats(statsData);
            setAchievements(achievementsData.achievements || []);
        } catch (error) {
            // Mock data
            setStats({
                totalXP: 450,
                level: 3,
                currentStreak: 5,
                longestStreak: 12,
                levelProgress: { current: 150, needed: 300, progress: 50 },
            });
            setAchievements([
                { id: '1', name: 'Başlangıç', description: 'İlk işlemini ekle', icon: '✨', category: 'tracking', xpReward: 25, unlocked: true },
                { id: '2', name: 'İlk Adım', description: 'İlk tasarruf hedefini oluştur', icon: '🎯', category: 'savings', xpReward: 50, unlocked: true },
                { id: '3', name: 'Takipçi', description: '10 işlem ekle', icon: '📝', category: 'tracking', xpReward: 75, unlocked: false },
                { id: '4', name: 'Düzenli', description: '7 gün art arda işlem ekle', icon: '🔥', category: 'streak', xpReward: 150, unlocked: false },
                { id: '5', name: 'Hedef Avcısı', description: 'Bir tasarruf hedefini tamamla', icon: '🏆', category: 'savings', xpReward: 200, unlocked: false },
                { id: '6', name: 'Tutumlu', description: 'Bir hafta bütçe aşma', icon: '🌟', category: 'budget', xpReward: 100, unlocked: false },
            ]);
        }
    };

    const categories = [
        { id: 'all', label: 'Tümü' },
        { id: 'tracking', label: 'Takip' },
        { id: 'savings', label: 'Tasarruf' },
        { id: 'streak', label: 'Seri' },
        { id: 'budget', label: 'Bütçe' },
    ];

    const filteredAchievements = selectedCategory === 'all'
        ? achievements
        : achievements.filter(a => a.category === selectedCategory);

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header with stats */}
                <LinearGradient
                    colors={['#8B5CF6', '#6D28D9']}
                    style={styles.headerCard}
                >
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelNumber}>{stats?.level || 1}</Text>
                    </View>
                    <Text style={styles.xpText}>{stats?.totalXP || 0} XP</Text>

                    {/* Level Progress */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View
                                style={[styles.progressFill, { width: `${stats?.levelProgress.progress || 0}%` }]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {stats?.levelProgress.current || 0} / {stats?.levelProgress.needed || 100}
                        </Text>
                    </View>

                    {/* Streak */}
                    <View style={styles.streakContainer}>
                        <View style={styles.streakItem}>
                            <Ionicons name="flame" size={24} color="#FCD34D" />
                            <Text style={styles.streakValue}>{stats?.currentStreak || 0}</Text>
                            <Text style={styles.streakLabel}>Günlük Seri</Text>
                        </View>
                        <View style={styles.streakDivider} />
                        <View style={styles.streakItem}>
                            <Ionicons name="trophy" size={24} color="#FCD34D" />
                            <Text style={styles.streakValue}>{stats?.longestStreak || 0}</Text>
                            <Text style={styles.streakLabel}>En Uzun</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Achievement Progress */}
                <Card style={styles.progressCard}>
                    <Text style={styles.progressTitle}>Başarı İlerlemesi</Text>
                    <View style={styles.achievementProgress}>
                        <View style={styles.achievementProgressBar}>
                            <View
                                style={[
                                    styles.achievementProgressFill,
                                    { width: `${(unlockedCount / achievements.length) * 100}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.achievementProgressText}>
                            {unlockedCount} / {achievements.length}
                        </Text>
                    </View>
                </Card>

                {/* Category Filter */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryContainer}
                >
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryButton,
                                selectedCategory === cat.id && styles.categoryButtonActive,
                            ]}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat.id && styles.categoryTextActive,
                            ]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Achievements Grid */}
                <View style={styles.achievementsGrid}>
                    {filteredAchievements.map((achievement) => (
                        <TouchableOpacity
                            key={achievement.id}
                            style={[
                                styles.achievementCard,
                                !achievement.unlocked && styles.achievementCardLocked,
                            ]}
                            activeOpacity={0.8}
                        >
                            <View style={[
                                styles.achievementIcon,
                                achievement.unlocked ? styles.achievementIconUnlocked : styles.achievementIconLocked,
                            ]}>
                                <Text style={styles.iconEmoji}>{achievement.icon}</Text>
                            </View>
                            <Text style={[
                                styles.achievementName,
                                !achievement.unlocked && styles.achievementNameLocked,
                            ]}>
                                {achievement.name}
                            </Text>
                            <Text style={styles.achievementDesc} numberOfLines={2}>
                                {achievement.description}
                            </Text>
                            <View style={styles.xpBadge}>
                                <Text style={styles.xpBadgeText}>+{achievement.xpReward} XP</Text>
                            </View>
                            {!achievement.unlocked && (
                                <View style={styles.lockOverlay}>
                                    <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.7)" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
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
    levelBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    levelNumber: {
        fontSize: Typography['3xl'],
        fontWeight: Typography.bold,
        color: Colors.white,
    },
    xpText: {
        fontSize: Typography.lg,
        fontWeight: Typography.semibold,
        color: Colors.white,
        marginBottom: Spacing.md,
    },
    progressContainer: {
        width: '100%',
        marginBottom: Spacing.lg,
    },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        marginBottom: Spacing.xs,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FCD34D',
        borderRadius: 4,
    },
    progressText: {
        fontSize: Typography.xs,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    streakItem: {
        flex: 1,
        alignItems: 'center',
    },
    streakValue: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.white,
        marginTop: Spacing.xs,
    },
    streakLabel: {
        fontSize: Typography.xs,
        color: 'rgba(255,255,255,0.7)',
    },
    streakDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    progressCard: {
        marginBottom: Spacing.lg,
    },
    progressTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    achievementProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    achievementProgressBar: {
        flex: 1,
        height: 8,
        backgroundColor: Colors.gray100,
        borderRadius: 4,
    },
    achievementProgressFill: {
        height: '100%',
        backgroundColor: '#8B5CF6',
        borderRadius: 4,
    },
    achievementProgressText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semibold,
        color: Colors.gray600,
    },
    categoryContainer: {
        paddingBottom: Spacing.md,
        gap: Spacing.sm,
    },
    categoryButton: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.gray100,
        marginRight: Spacing.sm,
    },
    categoryButtonActive: {
        backgroundColor: '#8B5CF6',
    },
    categoryText: {
        fontSize: Typography.sm,
        fontWeight: Typography.medium,
        color: Colors.gray600,
    },
    categoryTextActive: {
        color: Colors.white,
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    achievementCard: {
        width: '47%',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        position: 'relative',
    },
    achievementCardLocked: {
        opacity: 0.7,
    },
    achievementIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    achievementIconUnlocked: {
        backgroundColor: '#FEF3C7',
    },
    achievementIconLocked: {
        backgroundColor: Colors.gray100,
    },
    iconEmoji: {
        fontSize: 28,
    },
    achievementName: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    achievementNameLocked: {
        color: Colors.gray500,
    },
    achievementDesc: {
        fontSize: Typography.xs,
        color: Colors.gray500,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    xpBadge: {
        backgroundColor: '#8B5CF6' + '20',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    xpBadgeText: {
        fontSize: Typography.xs,
        fontWeight: Typography.semibold,
        color: '#8B5CF6',
    },
    lockOverlay: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
    },
});
