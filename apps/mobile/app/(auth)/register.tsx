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
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Typography, Spacing } from '@/constants/theme';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Hata', 'Tüm alanları doldurun');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Hata', 'Şifreler eşleşmiyor');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Hata', 'Şifre en az 6 karakter olmalı');
            return;
        }

        setLoading(true);
        const success = await register(email, password, name);
        setLoading(false);

        if (success) {
            router.replace('/(tabs)');
        } else {
            Alert.alert('Hata', 'Kayıt başarısız. Bu email zaten kullanılıyor olabilir.');
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
                    {/* Back button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={Colors.gray600} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <LinearGradient
                            colors={[Colors.success, Colors.successDark]}
                            style={styles.iconContainer}
                        >
                            <Ionicons name="person-add" size={36} color={Colors.white} />
                        </LinearGradient>
                        <Text style={styles.title}>Hesap Oluştur</Text>
                        <Text style={styles.subtitle}>Hemen ücretsiz başlayın</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Input
                            label="İsim"
                            placeholder="Adınız Soyadınız"
                            icon="person"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />

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
                            placeholder="En az 6 karakter"
                            icon="lock-closed"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Input
                            label="Şifre Tekrar"
                            placeholder="Şifrenizi tekrar girin"
                            icon="lock-closed"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />

                        <Button
                            title="Kayıt Ol"
                            onPress={handleRegister}
                            loading={loading}
                            style={styles.registerButton}
                        />

                        <Button
                            title="Zaten hesabın var mı? Giriş yap"
                            onPress={() => router.back()}
                            variant="ghost"
                        />
                    </View>

                    {/* Terms */}
                    <Text style={styles.terms}>
                        Kayıt olarak{' '}
                        <Text style={styles.link}>Kullanım Koşulları</Text>
                        {' '}ve{' '}
                        <Text style={styles.link}>Gizlilik Politikası</Text>
                        'nı kabul etmiş olursunuz.
                    </Text>
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
        padding: Spacing['2xl'],
        paddingTop: Spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing['3xl'],
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography['2xl'],
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
    registerButton: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    terms: {
        fontSize: Typography.xs,
        color: Colors.gray400,
        textAlign: 'center',
        marginTop: Spacing['2xl'],
        lineHeight: 18,
    },
    link: {
        color: Colors.primary,
        fontWeight: Typography.medium,
    },
});
