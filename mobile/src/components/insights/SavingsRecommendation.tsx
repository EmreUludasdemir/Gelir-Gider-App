import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface Recommendation {
  category: string;
  currentSpending: number;
  recommendedSpending: number;
  potentialSavings: number;
  tips: string[];
}

interface SavingsRecommendationProps {
  recommendation: Recommendation;
  onApply?: () => void;
}

export default function SavingsRecommendation({
  recommendation,
  onApply,
}: SavingsRecommendationProps) {
  const { colors, isDark } = useTheme();

  const savingsPercentage = (
    (recommendation.potentialSavings / recommendation.currentSpending) *
    100
  ).toFixed(0);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.iconContainer}
        >
          <Ionicons name="bulb" size={24} color="#FFF" />
        </LinearGradient>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>
            Tasarruf Önerisi
          </Text>
          <Text style={[styles.category, { color: colors.textSecondary }]}>
            {recommendation.category}
          </Text>
        </View>
      </View>

      <View style={styles.savingsCard}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.savingsGradient}
        >
          <Text style={styles.savingsLabel}>Potansiyel Tasarruf</Text>
          <View style={styles.savingsAmount}>
            <Text style={styles.savingsValue}>
              ₺{recommendation.potentialSavings.toLocaleString('tr-TR')}
            </Text>
            <View style={styles.savingsPercentage}>
              <Text style={styles.savingsPercentageText}>-%{savingsPercentage}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.comparison}>
        <View style={styles.comparisonItem}>
          <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>
            Mevcut Harcama
          </Text>
          <Text style={[styles.comparisonValue, { color: colors.text }]}>
            ₺{recommendation.currentSpending.toLocaleString('tr-TR')}
          </Text>
        </View>

        <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />

        <View style={styles.comparisonItem}>
          <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>
            Önerilen Harcama
          </Text>
          <Text style={[styles.comparisonValue, { color: '#10B981' }]}>
            ₺{recommendation.recommendedSpending.toLocaleString('tr-TR')}
          </Text>
        </View>
      </View>

      <View style={styles.tips}>
        <Text style={[styles.tipsTitle, { color: colors.text }]}>
          Nasıl Tasarruf Ederim?
        </Text>
        {recommendation.tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <View style={styles.tipBullet}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <Text style={[styles.tipText, { color: colors.text }]}>
              {tip}
            </Text>
          </View>
        ))}
      </View>

      {onApply && (
        <TouchableOpacity onPress={onApply}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.applyButton}
          >
            <Text style={styles.applyButtonText}>Bütçeye Uygula</Text>
            <Ionicons name="arrow-forward-circle" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  category: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  savingsCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  savingsGradient: {
    padding: 16,
  },
  savingsLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  savingsAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savingsValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
  },
  savingsPercentage: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  savingsPercentageText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFF',
  },
  comparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  comparisonLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  comparisonValue: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  tips: {
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  tipBullet: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#FFF',
  },
});
