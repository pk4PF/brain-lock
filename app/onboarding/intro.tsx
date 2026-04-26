import { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Animated,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { ArrowRight } from 'lucide-react-native';
import { FontFamily } from '../../src/constants/theme';
import { useThemeColors } from '../../src/hooks/useThemeColors';

const { width, height } = Dimensions.get('window');

const LOCKED_APPS = [
    { name: 'Instagram', color: '#C13584', icon: '📷' },
    { name: 'TikTok', color: '#010101', icon: '🎵' },
    { name: 'Twitter', color: '#1DA1F2', icon: '𝕏' },
    { name: 'YouTube', color: '#FF0000', icon: '▶' },
];

export default function IntroScreen() {
    const { colors, isDark } = useThemeColors();
    const scrollRef = useRef<ScrollView>(null);
    const [page, setPage] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Entrance animations
    const fadeIn = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeIn, {
                toValue: 1, duration: 600, useNativeDriver: true,
            }),
            Animated.spring(slideUp, {
                toValue: 0, friction: 8, tension: 50, useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleNext = () => {
        if (page < 2) {
            scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
        } else {
            router.push('/onboarding/name');
        }
    };

    const onScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    const handleMomentumEnd = (e: any) => {
        const newPage = Math.round(e.nativeEvent.contentOffset.x / width);
        setPage(newPage);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Ambient orbs */}
            <View style={[styles.orb1, { backgroundColor: isDark ? 'rgba(255,213,79,0.04)' : 'rgba(245,166,35,0.06)' }]} />
            <View style={[styles.orb2, { backgroundColor: isDark ? 'rgba(255,107,53,0.03)' : 'rgba(255,107,53,0.04)' }]} />

            {/* Page dots */}
            <View style={styles.dotsRow}>
                {[0, 1, 2].map((i) => {
                    const dotWidth = scrollX.interpolate({
                        inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                        outputRange: [8, 24, 8],
                        extrapolate: 'clamp',
                    });
                    const dotOpacity = scrollX.interpolate({
                        inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });
                    return (
                        <Animated.View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    width: dotWidth,
                                    opacity: dotOpacity,
                                    backgroundColor: colors.accent,
                                },
                            ]}
                        />
                    );
                })}
            </View>

            {/* Swipeable pages */}
            <Animated.View style={{ flex: 1, opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={onScroll}
                    onMomentumScrollEnd={handleMomentumEnd}
                    scrollEventThrottle={16}
                >
                    {/* Page 1: Value prop */}
                    <View style={styles.page}>
                        <View style={styles.pageContent}>
                            <Text style={[styles.headline, { color: colors.text }]}>
                                <Text style={{ color: colors.accent }}>brainlock</Text>
                                {' '}can help you take control of your screen time.
                            </Text>

                            <View style={styles.mascotWrap}>
                                <Image
                                    source={require('../../assets/mascot.png')}
                                    style={styles.mascot}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Page 2: How it works */}
                    <View style={styles.page}>
                        <View style={styles.pageContent}>
                            <Text style={[styles.headline, { color: colors.text }]}>
                                earn every minute.{' '}
                                <Text style={{ color: colors.accent }}>games, pushups, squats.</Text>
                            </Text>

                            <View style={styles.lottieWrap}>
                                <LottieView
                                    source={require('../../assets/animations/brain.json')}
                                    autoPlay
                                    loop
                                    speed={0.5}
                                    style={styles.lottie}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Page 3: Apps unlock */}
                    <View style={styles.page}>
                        <View style={styles.pageContent}>
                            <Text style={[styles.headline, { color: colors.text }]}>
                                once you{' '}
                                <Text style={{ color: colors.accent }}>play</Text>
                                , your apps unlock.
                            </Text>

                            <View style={styles.appsRow}>
                                {LOCKED_APPS.map((app) => (
                                    <View key={app.name} style={styles.appWrap}>
                                        <View style={[styles.appIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0' }]}>
                                            <Text style={styles.appEmoji}>{app.icon}</Text>
                                            {/* Lock overlay */}
                                            <View style={[styles.lockBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.55)' }]}>
                                                <Text style={styles.lockIcon}>🔒</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.appLabel, { color: colors.muted }]}>{app.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </Animated.View>

            {/* Bottom bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity onPress={() => router.push('/onboarding/name')} activeOpacity={0.7}>
                    <Text style={[styles.skipText, { color: colors.muted }]}>skip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: colors.accent }]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <ArrowRight size={22} color={isDark ? '#1A1A2E' : '#FFFFFF'} strokeWidth={2.5} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    orb1: {
        position: 'absolute',
        top: -60,
        right: -80,
        width: 260,
        height: 260,
        borderRadius: 130,
    },
    orb2: {
        position: 'absolute',
        bottom: height * 0.15,
        left: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingTop: height * 0.08,
        paddingBottom: 16,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    page: {
        width,
        flex: 1,
    },
    pageContent: {
        flex: 1,
        paddingHorizontal: 36,
        paddingTop: 32,
    },
    headline: {
        fontSize: 32,
        fontFamily: FontFamily.bold,
        lineHeight: 42,
        letterSpacing: -0.5,
    },
    mascotWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mascot: {
        width: width * 0.6,
        height: width * 0.6,
    },
    lottieWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottie: {
        width: width * 0.55,
        height: width * 0.55,
    },
    appsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 48,
    },
    appWrap: {
        alignItems: 'center',
        gap: 8,
    },
    appIcon: {
        width: 72,
        height: 72,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    appEmoji: {
        fontSize: 30,
    },
    lockBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        left: 0,
        top: 0,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
    },
    lockIcon: {
        fontSize: 20,
    },
    appLabel: {
        fontSize: 11,
        fontFamily: FontFamily.semibold,
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: height * 0.06,
    },
    skipText: {
        fontSize: 15,
        fontFamily: FontFamily.semibold,
    },
    nextBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
});
