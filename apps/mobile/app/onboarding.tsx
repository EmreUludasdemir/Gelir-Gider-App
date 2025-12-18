import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
    id: string;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    gradient: [string, string];
}

const SLIDES: OnboardingSlide[] = [
    {
        id: '1',
        title: 'Finanslarınızı Kontrol Altına Alın',
        description: 'Gelir ve giderlerinizi kolayca takip edin, harcamalarınızı kategorize edin ve finansal özgürlüğünüze giden yolda ilk adımı atın.',
        icon: 'wallet',
        gradient: ['#6366F1', '#4F46E5'],
    },
    {
        id: '2',
        title: 'Akıllı Bütçe Yönetimi',
        description: 'Bütçe hedefleri belirleyin, aşırı harcama uyarıları alın ve her ay ne kadar tasarruf ettiğinizi görün.',
        icon: 'pie-chart',
        gradient: ['#10B981', '#059669'],
    },
    {
        id: '3',
        title: 'PDF Ekstre Okuma',
        description: 'Banka ekstrenizi yükleyin, işlemleriniz otomatik olarak analiz edilsin. Artık tek tek girmenize gerek yok!',
        icon: 'document-text',
        gradient: ['#F59E0B', '#D97706'],
    },
    {
        id: '4',
        title: 'Başarılar Kazanın',
        description: 'Tasarruf hedeflerinize ulaşın, günlük serinizi sürdürün ve rozetler kazanarak motive olun!',
        icon: 'trophy',
        gradient: ['#EC4899', '#DB2777'],
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const router = useRouter();

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            handleGetStarted();
        }
    };

    const handleGetStarted = () => {
        // In real app, save onboarding completion to AsyncStorage
        router.replace('/(auth)/login');
    };

    const handleSkip = () => {
        router.replace('/(auth)/login');
    };

    const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
        return (
            <View style={styles.slide}>
                <LinearGradient
                    colors={item.gradient}
                    style={styles.iconContainer}
                >
                    <Ionicons name={item.icon} size={80} color={Colors.white} />
                </LinearGradient>

                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </View>
        );
    };

    const renderDots = () => {
        return (
            <View style={styles.dotsContainer}>
                {SLIDES.map((_, index) => {
                    const inputRange = [
                        (index - 1) * width,
                        index * width,
                        (index + 1) * width,
                    ];

                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [8, 24, 8],
                        extrapolate: 'clamp',
                    });

                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                { width: dotWidth, opacity },
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Skip Button */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Atla</Text>
            </TouchableOpacity>

            {/* Slides */}
            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            />

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
                {renderDots()}

                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <LinearGradient
                        colors={[Colors.primary, Colors.primaryDark]}
                        style={styles.nextButtonGradient}
                    >
                        <Text style={styles.nextButtonText}>
                            {currentIndex === SLIDES.length - 1 ? 'Başla' : 'Devam'}
                        </Text>
                        <Ionicons
                            name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
                            size={20}
                            color={Colors.white}
                        />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    skipButton: {
        position: 'absolute',
        top: 50,
        right: Spacing.xl,
        zIndex: 10,
        padding: Spacing.sm,
    },
    skipText: {
        fontSize: Typography.base,
        color: Colors.gray500,
        fontWeight: Typography.medium,
    },
    slide: {
        width,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing['2xl'],
        paddingTop: height * 0.1,
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing['3xl'],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: Typography.bold,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    description: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: Spacing.lg,
    },
    bottomSection: {
        paddingHorizontal: Spacing['2xl'],
        paddingBottom: Spacing['3xl'],
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing['2xl'],
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        marginHorizontal: 4,
    },
    nextButton: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    nextButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing['2xl'],
    },
    nextButtonText: {
        fontSize: Typography.lg,
        fontWeight: Typography.semibold,
        color: Colors.white,
    },
});
