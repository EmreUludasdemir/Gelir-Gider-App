import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import DonutChart from '../components/charts/DonutChart';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(0);
  const cardScale1 = useSharedValue(0);
  const cardScale2 = useSharedValue(0);
  const cardScale3 = useSharedValue(0);

  useEffect(() => {
    // Staggered card animations
    scale.value = withSpring(1, { damping: 15 });
    setTimeout(() => cardScale1.value = withSpring(1), 100);
    setTimeout(() => cardScale2.value = withSpring(1), 200);
    setTimeout(() => cardScale3.value = withSpring(1), 300);
  }, []);

  const balanceCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const card1Style = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale1.value }],
    opacity: interpolate(cardScale1.value, [0, 1], [0, 1]),
  }));

  const card2Style = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale2.value }],
    opacity: interpolate(cardScale2.value, [0, 1], [0, 1]),
  }));

  const card3Style = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale3.value }],
    opacity: interpolate(cardScale3.value, [0, 1], [0, 1]),
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Gradient */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Glassmorphism Balance Card */}
        <Animated.View style={[styles.balanceCard, balanceCardStyle]}>
          <BlurView intensity={isDark ? 20 : 80} tint={isDark ? 'dark' : 'light'} style={styles.glassCard}>
            <LinearGradient
              colors={isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.5)']}
              style={styles.glassGradient}
            >
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                Toplam Bakiye
              </Text>
              <Text style={[styles.balanceAmount, { color: colors.text }]}>
                ₺24,567.89
              </Text>

              <View style={styles.balanceStats}>
                <View style={styles.statItem}>
                  <Ionicons name="trending-up" size={20} color="#10B981" />
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gelir</Text>
                  <Text style={[styles.statValue, { color: '#10B981' }]}>₺35,420</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Ionicons name="trending-down" size={20} color="#EF4444" />
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gider</Text>
                  <Text style={[styles.statValue, { color: '#EF4444' }]}>₺10,852</Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={styles.actionText}>Ekle</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#EC4899', '#F43F5E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <Ionicons name="camera" size={24} color="#FFF" />
              <Text style={styles.actionText}>Tara</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <Ionicons name="analytics" size={24} color="#FFF" />
              <Text style={styles.actionText}>Rapor</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <Ionicons name="wallet" size={24} color="#FFF" />
              <Text style={styles.actionText}>Bütçe</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Charts Section */}
        <Animated.View style={[styles.section, card1Style]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Bu Ay - Harcama Dağılımı
          </Text>
          <DonutChart
            data={[
              { x: 'Yiyecek', y: 3500, color: '#EF4444' },
              { x: 'Ulaşım', y: 1200, color: '#F59E0B' },
              { x: 'Eğlence', y: 800, color: '#8B5CF6' },
              { x: 'Faturalar', y: 2100, color: '#6366F1' },
              { x: 'Diğer', y: 1252, color: '#10B981' },
            ]}
            centerText="Toplam"
            centerValue="₺8,852"
          />
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View style={[styles.section, card2Style]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Son İşlemler
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Tümü</Text>
            </TouchableOpacity>
          </View>

          {[1, 2, 3].map((item) => (
            <TouchableOpacity key={item} style={[styles.transactionCard, { backgroundColor: colors.card }]}>
              <View style={[styles.transactionIcon, { backgroundColor: '#F3F4F6' }]}>
                <Ionicons name="cart" size={20} color="#6366F1" />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={[styles.transactionTitle, { color: colors.text }]}>
                  Market Alışverişi
                </Text>
                <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                  Bugün, 14:30
                </Text>
              </View>
              <Text style={[styles.transactionAmount, { color: '#EF4444' }]}>
                -₺247.50
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Goals */}
        <Animated.View style={[styles.section, card3Style]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Tasarruf Hedefleri
          </Text>
          <View style={[styles.goalCard, { backgroundColor: colors.card }]}>
            <View style={styles.goalHeader}>
              <Text style={[styles.goalTitle, { color: colors.text }]}>Tatil</Text>
              <Text style={[styles.goalProgress, { color: colors.primary }]}>65%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '65%', backgroundColor: colors.primary }]} />
            </View>
            <View style={styles.goalFooter}>
              <Text style={[styles.goalAmount, { color: colors.textSecondary }]}>
                ₺6,500 / ₺10,000
              </Text>
              <Text style={[styles.goalDays, { color: colors.textSecondary }]}>
                45 gün kaldı
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.35,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  glassGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontFamily: 'Poppins-Bold',
    marginBottom: 20,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  chartCard: {
    borderRadius: 16,
    padding: 20,
    minHeight: 200,
  },
  chartPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  goalCard: {
    padding: 16,
    borderRadius: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  goalProgress: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalAmount: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  goalDays: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
