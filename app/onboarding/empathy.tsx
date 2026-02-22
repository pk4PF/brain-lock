import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { FontSize, FontFamily, Spacing } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';

const AMBER = '#F5A623';

interface EmpathyContent {
    stat: string;
    context: string;
    hook: string;
    source: string;
}

const EMPATHY_MAP: Record<string, EmpathyContent> = {
    screen_time: {
        stat: '4 hrs 37 min',
        context: 'That\'s how long the average person stares at their phone every single day.',
        hook: 'That\'s 70 full days a year lost to a screen. Days you\'ll never get back.',
        source: 'eMarketer, 2024',
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
        hook: 'Almost half your life on autopilot. Your brain isn\'t broken — it just hasn\'t been trained.',
        source: 'Killingsworth & Gilbert, Harvard, Science',
    },
    procrastination: {
        stat: '218 min',
        context: 'That\'s how much time the average worker loses to procrastination every single day.',
        hook: 'Over 3.5 hours a day — gone. Not from laziness, but from your brain chasing easy dopamine.',
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
    stat: '4 hrs 37 min',
    context: 'That\'s how long the average person stares at their phone every single day.',
    hook: 'That\'s 70 full days a year lost to a screen. Days you\'ll never get back.',
    source: 'eMarketer, 2024',
};

export default function EmpathyScreen() {
    const { userStruggles } = useStore();

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
                    {/* Big stat */}
                    <Animated.View style={animStyle(statAnim, 20)}>
                        <Text style={styles.stat}>{content.stat}</Text>
                    </Animated.View>

                    {/* Context */}
                    <Animated.View style={animStyle(contextAnim)}>
                        <Text style={styles.context}>{content.context}</Text>
                    </Animated.View>

                    {/* Divider */}
                    <Animated.View style={[styles.divider, { opacity: hookAnim }]} />

                    {/* Emotional hook */}
                    <Animated.View style={animStyle(hookAnim)}>
                        <Text style={styles.hook}>{content.hook}</Text>
                    </Animated.View>

                    {/* Source */}
                    <Animated.View style={animStyle(sourceAnim, 10)}>
                        <Text style={styles.source}>{content.source}</Text>
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
        paddingHorizontal: 36,
    },
    stat: {
        fontSize: 52,
        fontFamily: FontFamily.heavy,
        color: AMBER,
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -1,
    },
    context: {
        fontSize: 18,
        fontFamily: FontFamily.medium,
        color: '#1A1A2E',
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: 28,
    },
    divider: {
        width: 40,
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(245,166,35,0.3)',
        marginBottom: 28,
    },
    hook: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.regular,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    source: {
        fontSize: 12,
        fontFamily: FontFamily.medium,
        color: '#C4C4C4',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 56,
        alignItems: 'center',
    },
});
