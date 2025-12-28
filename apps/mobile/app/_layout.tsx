import { Stack } from 'expo-router';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { StatusBar } from 'expo-status-bar';

function AppContent() {
    const { token } = useAuth();
    const { isDark, colors } = useTheme();

    return (
        <OfflineProvider token={token}>
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <OfflineIndicator />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: 'slide_from_right',
                        contentStyle: { backgroundColor: colors.background },
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                    <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                </Stack>
            </View>
        </OfflineProvider>
    );
}

function ThemedApp() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <ThemedApp />
        </AuthProvider>
    );
}
