import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { VictoryLine, VictoryChart, VictoryArea, VictoryScatter } from 'victory-native';
import { Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

interface PredictionData {
  month: string;
  actual?: number;
  predicted?: number;
}

interface SpendingPredictionProps {
  data: PredictionData[];
  nextMonthPrediction: number;
  confidence: number;
}

export default function SpendingPrediction({
  data,
  nextMonthPrediction,
  confidence,
}: SpendingPredictionProps) {
  const { colors, isDark } = useTheme();

  const actualData = data.filter(d => d.actual).map(d => ({ x: d.month, y: d.actual! }));
  const predictedData = data.map(d => ({ x: d.month, y: d.predicted || d.actual || 0 }));

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="trending-up" size={24} color="#6366F1" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>
            Harcama Tahmini
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Gelecek ay için AI tahmini
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <VictoryChart
          width={340}
          height={180}
          padding={{ top: 20, bottom: 30, left: 50, right: 20 }}
        >
          <Defs>
            <SvgLinearGradient id="prediction-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#6366F1" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#6366F1" stopOpacity="0.05" />
            </SvgLinearGradient>
          </Defs>

          {/* Actual data */}
          <VictoryLine
            data={actualData}
            style={{
              data: {
                stroke: '#10B981',
                strokeWidth: 3,
              },
            }}
          />

          <VictoryScatter
            data={actualData}
            size={5}
            style={{
              data: { fill: '#10B981' },
            }}
          />

          {/* Predicted data */}
          <VictoryArea
            data={predictedData}
            style={{
              data: {
                fill: 'url(#prediction-gradient)',
                stroke: '#6366F1',
                strokeWidth: 3,
                strokeDasharray: '5,5',
              },
            }}
          />
        </VictoryChart>
      </View>

      <View style={styles.predictionBox}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.predictionGradient}
        >
          <View style={styles.predictionContent}>
            <Text style={styles.predictionLabel}>Tahmini Harcama</Text>
            <Text style={styles.predictionValue}>
              ₺{nextMonthPrediction.toLocaleString('tr-TR')}
            </Text>
          </View>

          <View style={styles.confidenceContainer}>
            <View style={styles.confidenceBar}>
              <View style={[styles.confidenceFill, { width: `${confidence}%` }]} />
            </View>
            <Text style={styles.confidenceText}>%{confidence} güven</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Gerçek</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Tahmin</Text>
        </View>
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
  header: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F120',
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
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionBox: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  predictionGradient: {
    padding: 16,
  },
  predictionContent: {
    marginBottom: 12,
  },
  predictionLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
  },
  confidenceContainer: {
    gap: 6,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.9)',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});
