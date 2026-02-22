import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { Sparkles } from 'lucide-react-native';
import { FontSize, Spacing } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';

const AMBER = '#F5A623';

export default function LetsGoScreen() {
    const { userName, completeOnboarding } = useStore();

    // Entrance animations
    const mascotAnim = useRef(new Animated.Value(0)).current;
    const titleAnim = useRef(new Animated.Value(0)).current;
    const subtitleAnim = useRef(new Animated.Value(0)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;
    const sparkleRotation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(150, [
            Animated.spring(mascotAnim, {
                toValue: 1,
                friction: 5,
                tension: 60,
                useNativeDriver: true,
            }),
            Animated.spring(titleAnim, {
                toValue: 1,
                friction: 8,
                tension: 60,
                useNativeDriver: true,
            }),
            Animated.spring(subtitleAnim, {
                toValue: 1,
                friction: 8,
                tension: 60,
                useNativeDriver: true,
            }),
            Animated.spring(buttonAnim, {
                toValue: 1,
                friction: 8,
                tension: 60,
                useNativeDriver: true,
            }),
        ]).start();

        // Subtle continuous sparkle rotation
        Animated.loop(
            Animated.timing(sparkleRotation, {
                toValue: 1,
                duration: 4000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const handleStart = () => {
        completeOnboarding();
        router.replace('/(tabs)');
    };

    const animStyle = (anim: Animated.Value, translateY = 30) => ({
        opacity: anim,
        transform: [
            {
                translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [translateY, 0],
                }),
            },
        ],
    });

    const greeting = userName ? `You're all set,\n${userName}!` : "You're all set!";

    return (
        <OnboardingLayout>
            <OnboardingBackButton />

            <View style={styles.content}>
                <View style={styles.centerSection}>
                    {/* Floating sparkles */}
                    <Animated.View
                        style={[
                            styles.sparkle1,
                            {
                                transform: [
                                    {
                                        rotate: sparkleRotation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0deg', '360deg'],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <Sparkles size={18} color={AMBER} />
                    </Animated.View>
                    <Animated.View
                        style={[
                            styles.sparkle2,
                            {
                                transform: [
                                    {
                                        rotate: sparkleRotation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['360deg', '0deg'],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <Sparkles size={14} color="rgba(245,166,35,0.5)" />
                    </Animated.View>

                    {/* Animated rocket */}
                    <Animated.View
                        style={[
                            styles.mascotContainer,
                            {
                                opacity: mascotAnim,
                                transform: [
                                    {
                                        scale: mascotAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.5, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.mascotGlow} />
                        <LottieView
                            source={require('../../assets/animations/rocket.json')}
                            autoPlay
                            loop
                            speed={0.7}
                            style={styles.rocketAnimation}
                        />
                    </Animated.View>

                    <Animated.View style={animStyle(titleAnim)}>
                        <Text style={styles.title}>{greeting}</Text>
                    </Animated.View>

                    <Animated.View style={animStyle(subtitleAnim)}>
                        <Text style={styles.subtitle}>
                            Time to take back your focus.{'\n'}
                            Every challenge makes you sharper.
                        </Text>
                    </Animated.View>

                    {/* Stats preview */}
                    <Animated.View style={[styles.statsRow, animStyle(subtitleAnim, 20)]}>
                        <View style={styles.statBox}>
                            <View style={styles.statIconContainer}>
                                <LottieView
                                    source={require('../../assets/animations/brain.json')}
                                    autoPlay
                                    loop
                                    speed={0.6}
                                    style={styles.statLottie}
                                />
                            </View>
                            <Text style={styles.statLabel}>Brain Games</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <View style={styles.statIconContainer}>
                                <LottieView
                                    source={require('../../assets/animations/flame.json')}
                                    autoPlay
                                    loop
                                    speed={0.8}
                                    style={styles.statLottie}
                                />
                            </View>
                            <Text style={styles.statLabel}>Daily Streaks</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <View style={styles.statIconContainer}>
                                <LottieView
                                    source={require('../../assets/animations/chart.json')}
                                    autoPlay
                                    loop
                                    speed={0.7}
                                    style={styles.statLottie}
                                />
                            </View>
                            <Text style={styles.statLabel}>Progress</Text>
                        </View>
                    </Animated.View>
                </View>

                <Animated.View style={[styles.bottomContainer, animStyle(buttonAnim)]}>
                    <OnboardingButton label="Let's Go" onPress={handleStart} />
                </Animated.View>
            </View>
        </OnboardingLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    centerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    sparkle1: {
        position: 'absolute',
        top: '18%',
        right: 50,
    },
    sparkle2: {
        position: 'absolute',
        top: '24%',
        left: 40,
    },
    mascotContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
    },
    mascotGlow: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(245,166,35,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(245,166,35,0.08)',
    },
    rocketAnimation: {
        width: 140,
        height: 140,
    },
    title: {
        fontSize: 30,
        fontWeight: '700',
        color: '#1A1A2E',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.3,
        lineHeight: 38,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 40,
        height: 40,
        marginBottom: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLottie: {
        width: 40,
        height: 40,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#E5E7EB',
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 56,
        alignItems: 'center',
    },
});
