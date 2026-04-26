import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { FontSize, FontFamily, Spacing } from '../../src/constants/theme';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useStore } from '../../src/store/useStore';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';

interface EmpathyContent {
    stat: string;
    context: string;
    hook: string;
    source: string;
}

const EMPATHY_MAP: Record<string, EmpathyContent> = {
    screen_time: {
        stat: '5 hrs 16 min',
        context: 'That\'s how long the average person spends looking down at their phone every single day.',
        hook: '80 full days a year lost to a screen. Days you\'ll never get back.',
        source: 'Harmony Healthcare IT, 2025',
    },
    social_media: {
        stat: '2 hrs 23 min',
        context: 'The average person spends this long scrolling social media every day.',
        hook: 'Over a lifetime, that adds up to 5.7 years. More time than you\'ll spend eating.',
        source: 'DataReportal Global Overview, 2024',
    },
    focus: {
        stat: '47%',
        context: 'of your waking hours are spent with a wandering mind, according to Harvard researchers.',
        hook: 'Almost half your life on autopilot. Your brain isn\'t broken. It just hasn\'t been trained.',
        source: 'Killingsworth & Gilbert, Harvard, Science',
    },
    procrastination: {
        stat: '218 min',
        context: 'That\'s how much time the average worker loses to procrastination every single day.',
        hook: '3.5 hours a day, gone. Not from laziness. Your brain is just chasing easy dopamine.',
        source: 'Salary.com Workplace Study',
    },
    habits: {
        stat: '92%',
        context: 'of people who set New Year\'s resolutions fail to keep them.',
        hook: 'Willpower alone doesn\'t work. Your brain needs a system, not just motivation.',
        source: 'University of Scranton Research',
    },
    brain_training: {
        stat: '33%',
        context: 'That\'s how much cognitive decline accelerates without regular mental exercise.',
        hook: 'Your brain is a muscle. Without daily training, it weakens faster than you think.',
        source: 'Alzheimer\'s Association Research',
    },
};

const DEFAULT_CONTENT: EmpathyContent = {
    stat: '5 hrs 16 min',
    context: 'That\'s how long the average person spends looking down at their phone every single day.',
    hook: 'That\'s 80 full days a year lost to a screen. Days you\'ll never get back.',
    source: 'Harmony Healthcare IT, 2025',
};

export default function EmpathyScreen() {
    const { userStruggles } = useStore();
    const { colors } = useThemeColors();

    const primaryStruggle = userStruggles[0];
    const content = primaryStruggle
        ? EMPATHY_MAP[primaryStruggle] || DEFAULT_CONTENT
        : DEFAULT_CONTENT;

    // Entrance animations
    const statAnim = useRef(new Animated.Value(0)).current;
    const contextAnim = useRef(new Animated.Value(0)).current;
    const hookAnim = useRef(new Animated.Value(0)).current;
    const sourceAnim = useRef(new Animated.Value(0)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(200, [
            Animated.spring(statAnim, {
                toValue: 1, friction: 8, tension: 50, useNativeDriver: true,
            }),
            Animated.spring(contextAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }),
            Animated.spring(hookAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }),
            Animated.spring(sourceAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }),
            Animated.spring(buttonAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }),
        ]).start();
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
                    {/* Big stat */}
                    <Animated.View style={animStyle(statAnim, 24)}>
                        <Text style={[styles.stat, { color: colors.accent }]}>{content.stat}</Text>
                    </Animated.View>

                    {/* Context */}
                    <Animated.View style={animStyle(contextAnim)}>
                        <Text style={[styles.context, { color: colors.text }]}>{content.context}</Text>
                    </Animated.View>

                    {/* Divider */}
                    <Animated.View style={[styles.divider, { opacity: hookAnim, backgroundColor: colors.accentGlow }]} />

                    {/* Emotional hook */}
                    <Animated.View style={animStyle(hookAnim)}>
                        <Text style={[styles.hook, { color: colors.secondary }]}>{content.hook}</Text>
                    </Animated.View>

                    {/* Source */}
                    <Animated.View style={animStyle(sourceAnim, 12)}>
                        <Text style={[styles.source, { color: colors.muted }]}>{content.source}</Text>
                    </Animated.View>
                </View>

                <Animated.View style={[styles.bottomContainer, animStyle(buttonAnim)]}>
                    <OnboardingButton
                        label="Continue"
                        onPress={() => router.push('/onboarding/howitworks')}
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
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    stat: {
        fontSize: 48,
        fontFamily: FontFamily.bold,
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -1,
    },
    context: {
        fontSize: 16,
        fontFamily: FontFamily.regular,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    divider: {
        width: 48,
        height: 3,
        borderRadius: 2,
        marginBottom: 32,
    },
    hook: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.regular,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    source: {
        fontSize: 12,
        fontFamily: FontFamily.regular,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 48,
        alignItems: 'center',
    },
});
