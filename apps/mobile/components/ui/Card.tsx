import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '@/constants/theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
    children,
    style,
    variant = 'default',
    padding = 'md'
}: CardProps) {
    const paddingStyles: Record<string, number> = {
        none: 0,
        sm: Spacing.sm,
        md: Spacing.lg,
        lg: Spacing.xl,
    };

    const variantStyles: Record<string, ViewStyle> = {
        default: {
            backgroundColor: Colors.card,
            ...Shadows.sm,
        },
        elevated: {
            backgroundColor: Colors.card,
            ...Shadows.lg,
        },
        outlined: {
            backgroundColor: Colors.card,
            borderWidth: 1,
            borderColor: Colors.gray200,
        },
    };

    return (
        <View
            style={[
                styles.card,
                variantStyles[variant],
                { padding: paddingStyles[padding] },
                style
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
