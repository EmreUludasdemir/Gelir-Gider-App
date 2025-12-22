import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import DonutChart from '../components/charts/DonutChart';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import SpendingHeatmap from '../components/charts/SpendingHeatmap';

const { width } = Dimensions.get('window');

type Period = 'week' | 'month' | 'year';

export default function ReportsScreen() {
  const { colors, isDark } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');

  // Mock data - in production, fetch from API
  const categoryData = [
    { x: 'Yiyecek', y: 3500, color: '#EF4444' },
    { x: 'Ulaşım', y: 1200, color: '#F59E0B' },
    { x: 'Eğlence', y: 800, color: '#8B5CF6' },
    { x: 'Faturalar', y: 2100, color: '#6366F1' },
    { x: 'Alışveriş', y: 1500, color: '#EC4899' },
    { x: 'Diğer', y: 900, color: '#10B981' },
  ];

  const trendData = [
    { x: 'Ock', y: 8500 },
    { x: 'Şub', y: 7200 },
    { x: 'Mar', y: 9100 },
    { x: 'Nis', y: 8800 },
    { x: 'May', y: 10200 },
    { x: 'Haz', y: 9500 },
    { x: 'Tem', y: 11000 },
  ];

  const incomeData = [
    { x: 'Ock', y: 15000 },
    { x: 'Şub', y: 15000 },
    { x: 'Mar', y: 16500 },
    { x: 'Nis', y: 15000 },
    { x: 'May', y: 17000 },
    { x: 'Haz', y: 15000 },
  ];

  const expenseData = [
    { x: 'Ock', y: 8500 },
    { x: 'Şub', y: 7200 },
    { x: 'Mar', y: 9100 },
    { x: 'Nis', y: 8800 },
    { x: 'May', y: 10200 },
    { x: 'Haz', y: 9500 },
  ];

  const heatmapData = [
    { day: 'Pzt', week: 1, amount: 450 },
    { day: 'Sal', week: 1, amount: 320 },
    { day: 'Çar', week: 1, amount: 680 },
    { day: 'Per', week: 1, amount: 520 },
    { day: 'Cum', week: 1, amount: 890 },
    { day: 'Cmt', week: 1, amount: 1200 },
    { day: 'Paz', week: 1, amount: 750 },
    // Week 2
    { day: 'Pzt', week: 2, amount: 380 },
    { day: 'Sal', week: 2, amount: 440 },
    { day: 'Çar', week: 2, amount: 590 },
    { day: 'Per', week: 2, amount: 720 },
    { day: 'Cum', week: 2, amount: 980 },
    { day: 'Cmt', week: 2, amount: 1100 },
    { day: 'Paz', week: 2, amount: 650 },
    // Week 3
    { day: 'Pzt', week: 3, amount: 420 },
    { day: 'Sal', week: 3, amount: 510 },
    { day: 'Çar', week: 3, amount: 640 },
    { day: 'Per', week: 3, amount: 580 },
    { day: 'Cum', week: 3, amount: 1050 },
    { day: 'Cmt', week: 3, amount: 1300 },
    { day: 'Paz', week: 3, amount: 800 },
    // Week 4
    { day: 'Pzt', week: 4, amount: 490 },
    { day: 'Sal', week: 4, amount: 560 },
    { day: 'Çar', week: 4, amount: 710 },
    { day: 'Per', week: 4, amount: 630 },
    { day: 'Cum', week: 4, amount: 920 },
    { day: 'Cmt', week: 4, amount: 1150 },
    { day: 'Paz', week: 4, amount: 780 },
  ];

  const totalExpenses = categoryData.reduce((sum, item) => sum + item.y, 0);

  const periods: { key: Period; label: string; icon: string }[] = [
    { key: 'week', label: 'Hafta', icon: 'calendar-outline' },
    { key: 'month', label: 'Ay', icon: 'calendar' },
    { key: 'year', label: 'Yıl', icon: 'calendar-sharp' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Raporlar</Text>
        <Text style={styles.headerSubtitle}>Detaylı Analiz</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <LinearGradient
                colors={
                  selectedPeriod === period.key
                    ? ['#6366F1', '#8B5CF6']
                    : ['transparent', 'transparent']
                }
                style={styles.periodGradient}
              >
                <Ionicons
                  name={period.icon as any}
                  size={20}
                  color={selectedPeriod === period.key ? '#FFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.periodText,
                    {
                      color: selectedPeriod === period.key ? '#FFF' : colors.textSecondary,
                    },
                  ]}
                >
                  {period.label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#10B98110' }]}>
              <Ionicons name="trending-up" size={24} color="#10B981" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Toplam Gelir
            </Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              ₺95,000
            </Text>
            <Text style={[styles.summaryChange, { color: '#10B981' }]}>
              +12.5%
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#EF444410' }]}>
              <Ionicons name="trending-down" size={24} color="#EF4444" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Toplam Gider
            </Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              ₺{totalExpenses.toLocaleString('tr-TR')}
            </Text>
            <Text style={[styles.summaryChange, { color: '#EF4444' }]}>
              +5.2%
            </Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <DonutChart
          data={categoryData}
          title="Kategori Dağılımı"
          centerText="Toplam Gider"
          centerValue={`₺${totalExpenses.toLocaleString('tr-TR')}`}
        />

        {/* Spending Trend */}
        <LineChart
          data={trendData}
          title="Harcama Trendi"
          color="#6366F1"
          showArea={true}
        />

        {/* Income vs Expense */}
        <BarChart
          incomeData={incomeData}
          expenseData={expenseData}
          title="Gelir vs Gider Karşılaştırması"
        />

        {/* Spending Heatmap */}
        <SpendingHeatmap data={heatmapData} title="Günlük Harcama Haritası" />

        {/* Insights */}
        <View style={[styles.insightsCard, { backgroundColor: colors.card }]}>
          <View style={styles.insightHeader}>
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <Text style={[styles.insightTitle, { color: colors.text }]}>
              Akıllı İçgörüler
            </Text>
          </View>

          <View style={styles.insight}>
            <View style={[styles.insightDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.insightText, { color: colors.text }]}>
              Bu ay geçen aya göre %8 daha az harcama yaptınız 🎉
            </Text>
          </View>

          <View style={styles.insight}>
            <View style={[styles.insightDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.insightText, { color: colors.text }]}>
              Eğlence kategorisinde ortalamanın üstünde harcama var
            </Text>
          </View>

          <View style={styles.insight}>
            <View style={[styles.insightDot, { backgroundColor: '#6366F1' }]} />
            <Text style={[styles.insightText, { color: colors.text }]}>
              Hafta sonları harcamalarınız %40 artıyor
            </Text>
          </View>
        </View>

        {/* Export Button */}
        <TouchableOpacity style={styles.exportButton}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.exportGradient}
          >
            <Ionicons name="download" size={20} color="#FFF" />
            <Text style={styles.exportText}>Raporu İndir (PDF/Excel)</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  periodButtonActive: {},
  periodGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  periodText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  summaryChange: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  insightsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  exportButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  exportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  exportText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#FFF',
  },
});
