import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryPie, VictoryLabel } from 'victory-native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface DataPoint {
  x: string;
  y: number;
  color: string;
}

interface DonutChartProps {
  data: DataPoint[];
  title?: string;
  centerText?: string;
  centerValue?: string;
}

export default function DonutChart({
  data,
  title,
  centerText = '',
  centerValue = ''
}: DonutChartProps) {
  const { colors, isDark } = useTheme();

  const total = data.reduce((sum, item) => sum + item.y, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      )}

      <View style={styles.chartContainer}>
        <VictoryPie
          data={data}
          width={width - 80}
          height={280}
          innerRadius={80}
          labelRadius={({ innerRadius }) => (innerRadius as number) + 40}
          style={{
            data: {
              fill: ({ datum }) => datum.color,
            },
            labels: {
              fontSize: 12,
              fontWeight: '600',
              fill: colors.text,
            },
          }}
          labels={({ datum }) => `${((datum.y / total) * 100).toFixed(0)}%`}
          animate={{
            duration: 1000,
            easing: 'bounce',
          }}
        />

        {/* Center Label */}
        <View style={styles.centerLabel}>
          <Text style={[styles.centerText, { color: colors.textSecondary }]}>
            {centerText}
          </Text>
          <Text style={[styles.centerValue, { color: colors.text }]}>
            {centerValue}
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>
              {item.x}
            </Text>
            <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
              ₺{item.y.toLocaleString('tr-TR')}
            </Text>
          </View>
        ))}
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
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  centerValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginTop: 4,
  },
  legend: {
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  legendValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});
