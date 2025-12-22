import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface AnomalyAlertProps {
  category: string;
  amount: number;
  averageAmount: number;
  percentage: number;
  date: string;
  onViewDetails?: () => void;
}

export default function AnomalyAlert({
  category,
  amount,
  averageAmount,
  percentage,
  date,
  onViewDetails,
}: AnomalyAlertProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={24} color="#F59E0B" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>
            Olağandışı Harcama Tespit Edildi
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {category} • {date}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Bu Harcama:
          </Text>
          <Text style={[styles.detailValue, { color: '#EF4444' }]}>
            ₺{amount.toLocaleString('tr-TR')}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Ortalama:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            ₺{averageAmount.toLocaleString('tr-TR')}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.percentageContainer}>
          <Ionicons name="trending-up" size={20} color="#EF4444" />
          <Text style={[styles.percentageText, { color: '#EF4444' }]}>
            Ortalamanın %{percentage} üstünde
          </Text>
        </View>
      </View>

      {onViewDetails && (
        <TouchableOpacity style={styles.actionButton} onPress={onViewDetails}>
          <Text style={[styles.actionText, { color: colors.primary }]}>
            Detayları Görüntüle
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  detailValue: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    marginVertical: 4,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EF444410',
    borderRadius: 8,
  },
  percentageText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});
