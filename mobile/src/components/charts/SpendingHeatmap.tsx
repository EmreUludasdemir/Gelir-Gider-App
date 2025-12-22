import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface HeatmapData {
  day: string;
  week: number;
  amount: number;
}

interface SpendingHeatmapProps {
  data: HeatmapData[];
  title?: string;
}

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const WEEKS = ['1. Hafta', '2. Hafta', '3. Hafta', '4. Hafta'];

export default function SpendingHeatmap({ data, title }: SpendingHeatmapProps) {
  const { colors, isDark } = useTheme();

  const getColorIntensity = (amount: number, maxAmount: number) => {
    const intensity = amount / maxAmount;

    if (intensity < 0.2) return isDark ? '#1E293B' : '#F1F5F9';
    if (intensity < 0.4) return isDark ? '#334155' : '#CBD5E1';
    if (intensity < 0.6) return '#6366F1';
    if (intensity < 0.8) return '#8B5CF6';
    return '#EC4899';
  };

  const maxAmount = Math.max(...data.map(d => d.amount));

  const getAmount = (week: number, dayIndex: number) => {
    const item = data.find(d => d.week === week && DAYS[dayIndex] === d.day);
    return item?.amount || 0;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.cornerCell} />
            {WEEKS.map((week, index) => (
              <View key={index} style={styles.headerCell}>
                <Text style={[styles.headerText, { color: colors.textSecondary }]}>
                  {week}
                </Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          {DAYS.map((day, dayIndex) => (
            <View key={dayIndex} style={styles.row}>
              <View style={styles.labelCell}>
                <Text style={[styles.labelText, { color: colors.text }]}>
                  {day}
                </Text>
              </View>
              {WEEKS.map((_, weekIndex) => {
                const amount = getAmount(weekIndex + 1, dayIndex);
                return (
                  <View
                    key={weekIndex}
                    style={[
                      styles.cell,
                      { backgroundColor: getColorIntensity(amount, maxAmount) },
                    ]}
                  >
                    {amount > 0 && (
                      <Text style={styles.cellText}>
                        {amount > 1000 ? `${(amount / 1000).toFixed(0)}k` : amount.toFixed(0)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Az</Text>
        <View style={styles.legendColors}>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, index) => (
            <View
              key={index}
              style={[
                styles.legendCell,
                { backgroundColor: getColorIntensity(maxAmount * intensity, maxAmount) },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Çok</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  cornerCell: {
    width: 50,
    height: 30,
  },
  headerCell: {
    width: 70,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  headerText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  labelCell: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  labelText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  cell: {
    width: 70,
    height: 50,
    marginHorizontal: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#FFF',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  legendColors: {
    flexDirection: 'row',
    gap: 4,
  },
  legendCell: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
});
