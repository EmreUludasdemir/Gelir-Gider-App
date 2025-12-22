import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

type InsightType = 'success' | 'warning' | 'info' | 'danger';

interface SmartInsightCardProps {
  type: InsightType;
  title: string;
  message: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  animated?: boolean;
}

const typeConfig = {
  success: {
    colors: ['#10B981', '#059669'],
    icon: 'checkmark-circle',
    bgColor: '#10B98110',
  },
  warning: {
    colors: ['#F59E0B', '#D97706'],
    icon: 'warning',
    bgColor: '#F59E0B10',
  },
  info: {
    colors: ['#6366F1', '#8B5CF6'],
    icon: 'information-circle',
    bgColor: '#6366F110',
  },
  danger: {
    colors: ['#EF4444', '#DC2626'],
    icon: 'alert-circle',
    bgColor: '#EF444410',
  },
};

export default function SmartInsightCard({
  type,
  title,
  message,
  icon,
  actionLabel,
  onAction,
  animated = true,
}: SmartInsightCardProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(animated ? 0 : 1);
  const opacity = useSharedValue(animated ? 0 : 1);

  const config = typeConfig[type];

  useEffect(() => {
    if (animated) {
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withTiming(1, { duration: 400 });
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={config.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
              <Ionicons name={icon || config.icon} size={24} color={config.colors[0]} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
            </View>
          </View>

          {actionLabel && onAction && (
            <TouchableOpacity style={styles.actionButton} onPress={onAction}>
              <Text style={styles.actionText}>{actionLabel}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
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
    color: '#FFF',
  },
  message: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#FFF',
  },
});
