import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { Sparkles } from 'lucide-react-native';
import { FontSize, Spacing } from '../../src/constants/theme';
import { FontFamily } from '../../src/constants/theme';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useStore } from '../../src/store/useStore';
import { track, Events } from '../../src/services/analytics';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';

export default function LetsGoScreen() {
    const { userName, completeOnboarding } = useStore();
    const { colors } = useThemeColors();

    // Entrance animations
    const mascotAnim = useRef(new Animated.Value(0)).current;
    const titleAnim = useRef(new Animated.Value(0)).current;
    const subtitleAnim = useRef(new Animated.Value(0)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;
    const sparkleRotation = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(150, [
            Animated.spring(mascotAnim, {
                toValue: 1,
                friction: 4,
                tension: 50,
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

        // Sparkle rotation
        Animated.loop(
            Animated.timing(sparkleRotation, {
                toValue: 1,
                duration: 4000,
                useNativeDriver: true,
            })
        ).start();

        // Mascot float loop — starts after entrance
        setTimeout(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim, { toValue: -8, duration: 1800, useNativeDriver: true }),
                    Animated.timing(floatAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
                ])
            ).start();
        }, 800);

        track(Events.OnboardingCompleted);
    }, []);

    const handleStart = () => {
        completeOnboarding();
        router.replace('/(tabs)');
    };

    const animStyle = (anim: Animated.Value, translateY = 32) => ({
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
                        <Sparkles size={16} color={colors.accent} />
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
                        <Sparkles size={12} color={colors.accentGlow} />
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
                                    { translateY: floatAnim },
                                ],
                            },
                        ]}
                    >
                        <View style={[styles.mascotGlow, { backgroundColor: colors.accentLight, borderColor: colors.accentLight }]} />
                        <LottieView
                            source={require('../../assets/animations/rocket.json')}
                            autoPlay
                            loop
                            speed={0.7}
                            style={styles.rocketAnimation}
                        />
                    </Animated.View>

                    <Animated.View style={animStyle(titleAnim)}>
                        <Text style={[styles.title, { color: colors.text }]}>{greeting}</Text>
                    </Animated.View>

                    <Animated.View style={animStyle(subtitleAnim)}>
                        <Text style={[styles.subtitle, { color: colors.secondary }]}>
                            Time to take back your focus.{'\n'}
                            Every challenge makes you sharper.
                        </Text>
                    </Animated.View>

                    {/* Stats preview */}
                    <Animated.View style={[styles.statsRow, animStyle(subtitleAnim, 24), { backgroundColor: colors.card, borderColor: colors.accentLight }]}>
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
                            <Text style={[styles.statLabel, { color: colors.muted }]}>Earn XP</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
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
                            <Text style={[styles.statLabel, { color: colors.muted }]}>Daily Streaks</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
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
                            <Text style={[styles.statLabel, { color: colors.muted }]}>Progress</Text>
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
        right: 48,
    },
    sparkle2: {
        position: 'absolute',
        top: '24%',
        left: 48,
    },
    mascotContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    mascotGlow: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 1,
    },
    rocketAnimation: {
        width: 140,
        height: 140,
    },
    title: {
        fontSize: 32,
        fontFamily: FontFamily.bold,
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.3,
        lineHeight: 38,
    },
    subtitle: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.regular,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderWidth: 1,
        ...({
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
        }),
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 44,
        height: 44,
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLottie: {
        width: 44,
        height: 44,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: FontFamily.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 32,
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 48,
        alignItems: 'center',
    },
});
