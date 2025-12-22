import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import SmartInsightCard from '../components/insights/SmartInsightCard';
import AnomalyAlert from '../components/insights/AnomalyAlert';
import SpendingPrediction from '../components/insights/SpendingPrediction';
import SavingsRecommendation from '../components/insights/SavingsRecommendation';

export default function InsightsScreen() {
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 2000);
  };

  // Mock data
  const predictionData = [
    { month: 'Ock', actual: 8500 },
    { month: 'Şub', actual: 7200 },
    { month: 'Mar', actual: 9100 },
    { month: 'Nis', actual: 8800 },
    { month: 'May', actual: 10200 },
    { month: 'Haz', actual: 9500 },
    { month: 'Tem', predicted: 10800 },
  ];

  const savingsRecommendation = {
    category: 'Yiyecek & İçecek',
    currentSpending: 3500,
    recommendedSpending: 2800,
    potentialSavings: 700,
    tips: [
      'Haftalık yemek planı yaparak market alışverişini optimize edin',
      'Dışarıda yemek yerine ev yemekleri tercih edin (haftada 2-3 gün)',
      'İndirim dönemlerini takip edin ve toplu alışveriş yapın',
    ],
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>AI İçgörüler</Text>
            <Text style={styles.headerSubtitle}>
              Harcamalarınızı optimize edin
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* AI Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreContent}>
            <View style={styles.scoreLeft}>
              <Text style={styles.scoreLabel}>AI Skor</Text>
              <Text style={styles.scoreValue}>85/100</Text>
              <Text style={styles.scoreDescription}>Harika gidiyorsunuz! 🎉</Text>
            </View>
            <View style={styles.scoreRight}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreCircleText}>A</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Insights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Hızlı İçgörüler
          </Text>

          <SmartInsightCard
            type="success"
            title="Harika İş!"
            message="Bu ay geçen aya göre %12 daha az harcama yaptınız. Tasarruf hedefinize ulaşmak üzeresiniz."
            icon="trophy"
          />

          <SmartInsightCard
            type="info"
            title="Düzenli Ödeme"
            message="Elektrik faturanız 3 gün içinde ödenecek. Otomatik ödeme ayarlayarak unutmayı önleyebilirsiniz."
            actionLabel="Ayarla"
            onAction={() => console.log('Setup auto-pay')}
          />

          <SmartInsightCard
            type="warning"
            title="Bütçe Uyarısı"
            message="Eğlence kategorisinde belirlediğiniz bütçenin %85'ine ulaştınız. Dikkatli olun!"
          />
        </View>

        {/* Anomaly Detection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Olağandışı Harcamalar
          </Text>

          <AnomalyAlert
            category="Alışveriş"
            amount={1850}
            averageAmount={650}
            percentage={185}
            date="18 Haz"
            onViewDetails={() => console.log('View details')}
          />
        </View>

        {/* Spending Prediction */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Gelecek Tahminleri
          </Text>

          <SpendingPrediction
            data={predictionData}
            nextMonthPrediction={10800}
            confidence={87}
          />
        </View>

        {/* Savings Recommendations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Tasarruf Önerileri
          </Text>

          <SavingsRecommendation
            recommendation={savingsRecommendation}
            onApply={() => console.log('Apply recommendation')}
          />
        </View>

        {/* Weekly Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            Bu Hafta Özeti
          </Text>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Ionicons name="cash" size={24} color="#10B981" />
              <Text style={[styles.summaryStatValue, { color: colors.text }]}>
                ₺2,340
              </Text>
              <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                Harcama
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryStatItem}>
              <Ionicons name="trending-down" size={24} color="#6366F1" />
              <Text style={[styles.summaryStatValue, { color: colors.text }]}>
                -8%
              </Text>
              <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                Değişim
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryStatItem}>
              <Ionicons name="star" size={24} color="#F59E0B" />
              <Text style={[styles.summaryStatValue, { color: colors.text }]}>
                47
              </Text>
              <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                İşlem
              </Text>
            </View>
          </View>
        </View>

        {/* AI Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>
              AI Önerileri
            </Text>
          </View>

          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Sabah kahvesi yerine ev yapımı kahve tercih ederek ayda ₺450 tasarruf edebilirsiniz
            </Text>
          </View>

          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Kullanmadığınız 3 aboneliği iptal ederek ayda ₺290 kazanabilirsiniz
            </Text>
          </View>

          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Hafta sonu harcamalarınız %40 daha fazla, önceden plan yapın
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLeft: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.9)',
  },
  scoreRight: {
    marginLeft: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  scoreCircleText: {
    fontSize: 36,
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 12,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  summaryStatValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },
  summaryStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  summaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  tipsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  tip: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});
