import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { FontSize, FontFamily, Spacing } from '../../src/constants/theme';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';

const STEPS = [
    {
        lottie: require('../../assets/animations/lock.json'),
        title: 'You reach for a distracting app',
        subtitle: 'TikTok, Instagram, Twitter...',
    },
    {
        lottie: require('../../assets/animations/brain.json'),
        title: 'Complete a quick challenge',
        subtitle: 'Improve mental or physical health.',
    },
    {
        lottie: require('../../assets/animations/success.json'),
        title: 'App unlocked. You earned it!',
        subtitle: 'Every unlock is earned, not given.',
    },
];

export default function HowItWorksScreen() {
    const { colors } = useThemeColors();

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

    const animStyle = (anim: Animated.Value, translateY = 32) => ({
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
                        <Text style={[styles.title, { color: colors.text }]}>How BrainLock Works</Text>
                        <Text style={[styles.subtitle, { color: colors.muted }]}>
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
                                                outputRange: [24, 0],
                                            }),
                                        },
                                        { scale: stepScales[index] },
                                    ],
                                }}
                            >
                                {/* Connector line */}
                                {index > 0 && (
                                    <View style={styles.connectorContainer}>
                                        <View style={[styles.connectorLine, { backgroundColor: colors.accentGlow }]} />
                                    </View>
                                )}

                                <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.accentLight }]}>
                                    {/* Step number badge */}
                                    <View style={[styles.stepBadge, { backgroundColor: colors.accent }]}>
                                        <Text style={styles.stepNumber}>{index + 1}</Text>
                                    </View>

                                    {/* Lottie icon */}
                                    <View style={[styles.stepIconContainer, { backgroundColor: colors.accentLight, borderColor: colors.accentGlow }]}>
                                        <LottieView
                                            source={step.lottie}
                                            autoPlay
                                            loop
                                            speed={0.6}
                                            style={styles.stepLottie}
                                        />
                                    </View>

                                    {/* Text */}
                                    <View style={styles.stepTextContainer}>
                                        <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                                        <Text style={[styles.stepSubtitle, { color: colors.muted }]}>{step.subtitle}</Text>
                                    </View>
                                </View>
                            </Animated.View>
                        ))}
                    </View>
                </View>

                <Animated.View style={[styles.bottomContainer, animStyle(buttonAnim)]}>
                    <OnboardingButton
                        label="Let's Go"
                        onPress={() => router.push('/onboarding/letsgo')}
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
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.regular,
        textAlign: 'center',
        lineHeight: 22,
    },
    stepsContainer: {
        gap: 0,
    },
    connectorContainer: {
        alignItems: 'center',
        height: 24,
        justifyContent: 'center',
    },
    connectorLine: {
        width: 2,
        height: 24,
        borderRadius: 1,
    },
    stepCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        ...({
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
        }),
    },
    stepBadge: {
        position: 'absolute',
        top: -12,
        left: 16,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumber: {
        fontSize: 12,
        fontFamily: FontFamily.bold,
        color: '#FFFFFF',
    },
    stepIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
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
        marginBottom: 4,
        lineHeight: 20,
    },
    stepSubtitle: {
        fontSize: FontSize.sm,
        fontFamily: FontFamily.regular,
        lineHeight: 18,
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 48,
        alignItems: 'center',
    },
});
