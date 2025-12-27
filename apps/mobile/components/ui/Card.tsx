import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
    children,
    style,
    variant = 'default',
    padding = 'md'
}: CardProps) {
    const { colors, isDark } = useTheme();

    const paddingStyles: Record<string, number> = {
        none: 0,
        sm: Spacing.sm,
        md: Spacing.lg,
        lg: Spacing.xl,
    };

    const variantStyles: Record<string, ViewStyle> = {
        default: {
            backgroundColor: colors.card,
            ...Shadows.sm,
        },
        elevated: {
            backgroundColor: colors.card,
            ...(isDark ? Shadows.sm : Shadows.lg),
        },
        outlined: {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
    };

    return (
        <View
            style={[
                styles.card,
                variantStyles[variant],
                { padding: paddingStyles[padding] },
                ...(Array.isArray(style) ? style : [style])
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
});
