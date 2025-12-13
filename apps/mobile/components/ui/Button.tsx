import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, BorderRadius, Spacing } from '@/constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    style,
}: ButtonProps) {
    const isDisabled = disabled || loading;

    const sizeStyles: Record<string, { height: number; paddingHorizontal: number; fontSize: number }> = {
        sm: { height: 36, paddingHorizontal: 12, fontSize: Typography.sm },
        md: { height: 48, paddingHorizontal: 20, fontSize: Typography.base },
        lg: { height: 56, paddingHorizontal: 24, fontSize: Typography.lg },
    };

    const currentSize = sizeStyles[size];

    if (variant === 'primary') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                style={[styles.button, { height: currentSize.height }, style]}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={isDisabled ? [Colors.gray400, Colors.gray400] : [Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.gradient, { paddingHorizontal: currentSize.paddingHorizontal }]}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <>
                            {icon}
                            <Text style={[styles.text, styles.textWhite, { fontSize: currentSize.fontSize }]}>
                                {title}
                            </Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    const variantStyles: Record<string, { bg: ViewStyle; text: TextStyle }> = {
        secondary: {
            bg: { backgroundColor: Colors.gray100 },
            text: { color: Colors.gray800 },
        },
        outline: {
            bg: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
            text: { color: Colors.primary },
        },
        ghost: {
            bg: { backgroundColor: 'transparent' },
            text: { color: Colors.primary },
        },
        danger: {
            bg: { backgroundColor: Colors.danger },
            text: { color: Colors.white },
        },
    };

    const currentVariant = variantStyles[variant];

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            style={[
                styles.button,
                styles.flatButton,
                currentVariant.bg,
                { height: currentSize.height, paddingHorizontal: currentSize.paddingHorizontal },
                isDisabled && styles.disabled,
                style,
            ]}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={currentVariant.text.color} />
            ) : (
                <>
                    {icon}
                    <Text style={[styles.text, currentVariant.text, { fontSize: currentSize.fontSize }]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    flatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    text: {
        fontWeight: Typography.semibold,
    },
    textWhite: {
        color: Colors.white,
    },
    disabled: {
        opacity: 0.5,
    },
});
