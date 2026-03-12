import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { FontSize, FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';

const AMBER = '#E8850C';
const AMBER_DIM = 'rgba(232,133,12,0.08)';
const AMBER_GLOW = 'rgba(232,133,12,0.25)';

const STEPS = [
    {
        lottie: require('../../assets/animations/lock.json'),
        title: 'You reach for a distracting app',
        subtitle: 'TikTok, Instagram, Twitter...',
    },
    {
        lottie: require('../../assets/animations/brain.json'),
        title: 'Complete a quick brain challenge',
        subtitle: 'Math, memory, patterns. Pick your games!',
    },
    {
        lottie: require('../../assets/animations/success.json'),
        title: 'App unlocked. You earned it!',
        subtitle: 'Build real cognitive skills along the way',
    },
];

export default function HowItWorksScreen() {
    // Entrance animations
    const titleAnim = useRef(new Animated.Value(0)).current;
    const stepAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;

    // Step scale bounce
    const stepScales = useRef(STEPS.map(() => new Animated.Value(0.9))).current;

    useEffect(() => {
        // Title first
        Animated.spring(titleAnim, {
            toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
        }).start();

        // Stagger steps with scale bounce
        setTimeout(() => {
            STEPS.forEach((_, i) => {
                setTimeout(() => {
                    Animated.parallel([
                        Animated.spring(stepAnims[i], {
                            toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
                        }),
                        Animated.spring(stepScales[i], {
                            toValue: 1, friction: 5, tension: 60, useNativeDriver: true,
                        }),
                    ]).start();
                }, i * 200);
            });
        }, 200);

        // Button last
        setTimeout(() => {
            Animated.spring(buttonAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }).start();
        }, 200 + STEPS.length * 200 + 100);
    }, []);

    const animStyle = (anim: Animated.Value, translateY = 30) => ({
        opacity: anim,
        transform: [{
            translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [translateY, 0],
            }),
        }],
    });

    return (
        <OnboardingLayout>
            <OnboardingBackButton />

            <View style={styles.content}>
                <View style={styles.centerSection}>
                    {/* Header */}
                    <Animated.View style={[styles.headerSection, animStyle(titleAnim)]}>
                        <Text style={styles.title}>How BrainLock Works</Text>
                        <Text style={styles.subtitle}>
                            Simple, fun, and takes under 60 seconds
                        </Text>
                    </Animated.View>

                    {/* Steps */}
                    <View style={styles.stepsContainer}>
                        {STEPS.map((step, index) => (
                            <Animated.View
                                key={index}
                                style={{
                                    opacity: stepAnims[index],
                                    transform: [
                                        {
                                            translateY: stepAnims[index].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [25, 0],
                                            }),
                                        },
                                        { scale: stepScales[index] },
                                    ],
                                }}
                            >
                                {/* Connector line */}
                                {index > 0 && (
                                    <View style={styles.connectorContainer}>
                                        <View style={styles.connectorLine} />
                                    </View>
                                )}

                                <View style={styles.stepCard}>
                                    {/* Step number badge */}
                                    <View style={styles.stepBadge}>
                                        <Text style={styles.stepNumber}>{index + 1}</Text>
                                    </View>

                                    {/* Lottie icon */}
                                    <View style={styles.stepIconContainer}>
                                        <LottieView
                                            source={step.lottie}
                                            autoPlay
                                            loop={index !== 2}
                                            speed={0.6}
                                            style={styles.stepLottie}
                                        />
                                    </View>

                                    {/* Text */}
                                    <View style={styles.stepTextContainer}>
                                        <Text style={styles.stepTitle}>{step.title}</Text>
                                        <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                                    </View>
                                </View>
                            </Animated.View>
                        ))}
                    </View>
                </View>

                <Animated.View style={[styles.bottomContainer, animStyle(buttonAnim)]}>
                    <OnboardingButton
                        label="Let's Go"
                        onPress={() => router.push('/onboarding/paywall')}
                    />
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
        paddingHorizontal: 24,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontFamily: FontFamily.bold,
        color: '#1A1A2E',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.regular,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 22,
    },
    stepsContainer: {
        gap: 0,
    },
    connectorContainer: {
        alignItems: 'center',
        height: 20,
        justifyContent: 'center',
    },
    connectorLine: {
        width: 2,
        height: 20,
        backgroundColor: AMBER_GLOW,
        borderRadius: 1,
    },
    stepCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(232,133,12,0.12)',
        shadowColor: '#E8850C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 3,
    },
    stepBadge: {
        position: 'absolute',
        top: -10,
        left: 16,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: AMBER,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    stepNumber: {
        fontSize: 12,
        fontFamily: FontFamily.bold,
        color: '#FFFFFF',
    },
    stepIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: AMBER_DIM,
        borderWidth: 1,
        borderColor: AMBER_GLOW,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        overflow: 'hidden',
    },
    stepLottie: {
        width: 44,
        height: 44,
    },
    stepTextContainer: {
        flex: 1,
    },
    stepTitle: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.bold,
        color: '#1A1A2E',
        marginBottom: 3,
        lineHeight: 20,
    },
    stepSubtitle: {
        fontSize: FontSize.sm,
        fontFamily: FontFamily.regular,
        color: '#9CA3AF',
        lineHeight: 18,
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 56,
        alignItems: 'center',
    },
});
