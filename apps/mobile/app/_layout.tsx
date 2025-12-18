import { Stack } from 'expo-router';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { StatusBar } from 'expo-status-bar';

function AppContent() {
    const { token } = useAuth();

    return (
        <OfflineProvider token={token}>
            <View style={{ flex: 1 }}>
                <OfflineIndicator />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: 'slide_from_right',
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

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="dark" />
            <AppContent />
        </AuthProvider>
    );
}
