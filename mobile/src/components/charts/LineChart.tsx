import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryArea, VictoryGroup } from 'victory-native';
import { LinearGradient, Defs, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface DataPoint {
  x: string | number;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  color?: string;
  showArea?: boolean;
  yAxisFormat?: (value: number) => string;
}

export default function LineChart({
  data,
  title,
  color = '#6366F1',
  showArea = true,
  yAxisFormat = (val) => `₺${val}`,
}: LineChartProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      )}

      <VictoryChart
        width={width - 40}
        height={300}
        padding={{ top: 20, bottom: 40, left: 60, right: 20 }}
      >
        <Defs>
          <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>

        <VictoryAxis
          style={{
            axis: { stroke: isDark ? '#374151' : '#E5E7EB' },
            tickLabels: {
              fontSize: 10,
              fill: colors.textSecondary,
              fontFamily: 'Inter-Regular',
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
          tickFormat={yAxisFormat}
        />

        {showArea && (
          <VictoryArea
            data={data}
            style={{
              data: { fill: 'url(#gradient)' },
            }}
            animate={{
              duration: 1000,
              onLoad: { duration: 500 },
            }}
          />
        )}

        <VictoryLine
          data={data}
          style={{
            data: {
              stroke: color,
              strokeWidth: 3,
              strokeLinecap: 'round',
            },
          }}
          animate={{
            duration: 1000,
            onLoad: { duration: 500 },
          }}
        />
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
    marginBottom: 8,
  },
});
