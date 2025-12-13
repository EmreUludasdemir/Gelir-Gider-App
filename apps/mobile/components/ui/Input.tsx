import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
}

export function Input({
    label,
    error,
    icon,
    rightIcon,
    onRightIconPress,
    secureTextEntry,
    style,
    ...props
}: InputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = secureTextEntry !== undefined;

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View
                style={[
                    styles.inputContainer,
                    isFocused && styles.inputFocused,
                    error && styles.inputError,
                ]}
            >
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={isFocused ? Colors.primary : Colors.gray400}
                        style={styles.leftIcon}
                    />
                )}

                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={Colors.gray400}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isPassword && !showPassword}
                    {...props}
                />

                {isPassword && (
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.rightIcon}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color={Colors.gray400}
                        />
                    </TouchableOpacity>
                )}

                {rightIcon && !isPassword && (
                    <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
                        <Ionicons name={rightIcon} size={20} color={Colors.gray400} />
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.sm,
        fontWeight: Typography.medium,
        color: Colors.gray700,
        marginBottom: Spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gray50,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        borderColor: Colors.gray200,
        paddingHorizontal: Spacing.lg,
        height: 52,
    },
    inputFocused: {
        borderColor: Colors.primary,
        backgroundColor: Colors.white,
    },
    inputError: {
        borderColor: Colors.danger,
    },
    input: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.text,
        paddingVertical: 0,
    },
    leftIcon: {
        marginRight: Spacing.md,
    },
    rightIcon: {
        marginLeft: Spacing.md,
        padding: Spacing.xs,
    },
    error: {
        fontSize: Typography.xs,
        color: Colors.danger,
        marginTop: Spacing.xs,
    },
});
