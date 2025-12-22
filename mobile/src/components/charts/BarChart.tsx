import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryGroup } from 'victory-native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface DataPoint {
  x: string;
  y: number;
}

interface BarChartProps {
  incomeData: DataPoint[];
  expenseData: DataPoint[];
  title?: string;
}

export default function BarChart({ incomeData, expenseData, title }: BarChartProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Gelir</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Gider</Text>
        </View>
      </View>

      <VictoryChart
        width={width - 40}
        height={300}
        padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
        domainPadding={{ x: 20 }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: isDark ? '#374151' : '#E5E7EB' },
            tickLabels: {
              fontSize: 10,
              fill: colors.textSecondary,
              fontFamily: 'Inter-Regular',
              angle: -45,
              textAnchor: 'end',
            },
            grid: { stroke: 'transparent' },
          }}
        />

        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: isDark ? '#374151' : '#E5E7EB' },
            tickLabels: {
              fontSize: 10,
              fill: colors.textSecondary,
              fontFamily: 'Inter-Regular',
            },
            grid: {
              stroke: isDark ? '#374151' : '#E5E7EB',
              strokeDasharray: '4,4',
            },
          }}
          tickFormat={(val) => `₺${val / 1000}k`}
        />

        <VictoryGroup
          offset={15}
          colorScale={['#10B981', '#EF4444']}
        >
          <VictoryBar
            data={incomeData}
            cornerRadius={{ top: 8 }}
            style={{
              data: {
                fill: '#10B981',
              },
            }}
            animate={{
              duration: 1000,
              onLoad: { duration: 500 },
            }}
          />
          <VictoryBar
            data={expenseData}
            cornerRadius={{ top: 8 }}
            style={{
              data: {
                fill: '#EF4444',
              },
            }}
            animate={{
              duration: 1000,
              onLoad: { duration: 500 },
            }}
          />
        </VictoryGroup>
      </VictoryChart>
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
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
});
