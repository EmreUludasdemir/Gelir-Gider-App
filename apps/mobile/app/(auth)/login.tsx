import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Typography, Spacing } from '@/constants/theme';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Hata', 'Email ve şifre gereklidir');
            return;
        }

        setLoading(true);
        const success = await login(email, password);
        setLoading(false);

        if (success) {
            router.replace('/(tabs)');
        } else {
            Alert.alert('Hata', 'Giriş başarısız. Bilgilerinizi kontrol edin.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryDark]}
                            style={styles.iconContainer}
                        >
                            <Ionicons name="wallet" size={40} color={Colors.white} />
                        </LinearGradient>
                        <Text style={styles.title}>Gelir-Gider</Text>
                        <Text style={styles.subtitle}>Finanslarınızı kontrol altına alın</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Input
                            label="E-posta"
                            placeholder="ornek@email.com"
                            icon="mail"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Input
                            label="Şifre"
                            placeholder="••••••••"
                            icon="lock-closed"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Button
                            title="Giriş Yap"
                            onPress={handleLogin}
                            loading={loading}
                            style={styles.loginButton}
                        />

                        <Button
                            title="Hesabın yok mu? Kayıt ol"
                            onPress={() => router.push('/(auth)/register')}
                            variant="ghost"
                        />
                    </View>

                    {/* Demo hint */}
                    <View style={styles.demoHint}>
                        <Ionicons name="information-circle" size={16} color={Colors.gray400} />
                        <Text style={styles.demoText}>
                            Demo: test@test.com / 123456
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Spacing['2xl'],
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing['4xl'],
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography['3xl'],
        fontWeight: Typography.bold,
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
    },
    form: {
        width: '100%',
    },
    loginButton: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    demoHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing['3xl'],
        gap: Spacing.xs,
    },
    demoText: {
        fontSize: Typography.sm,
        color: Colors.gray400,
    },
});
