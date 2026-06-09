import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FontFamily } from '../../constants/theme';

interface OnboardingProgressProps {
    currentStep: number;
    totalSteps: number;
}

export default function OnboardingProgress({
    currentStep,
    totalSteps,
}: OnboardingProgressProps) {
    const widthAnim = useRef(new Animated.Value(0)).current;
    const { colors } = useThemeColors();

    useEffect(() => {
        Animated.spring(widthAnim, {
            toValue: (currentStep / totalSteps) * 100,
            friction: 12,
            tension: 60,
            useNativeDriver: false,
        }).start();
    }, [currentStep]);

    return (
        <View style={styles.container}>
            {/* Small uppercase counter above the bar - tells the user
                exactly where they are without having to count notches. */}
            <Text style={[styles.label, { color: colors.muted }]}>
                STEP {currentStep} OF {totalSteps}
            </Text>

            <View style={[styles.track, { backgroundColor: colors.cardAlt }]}>
                <Animated.View
                    style={[
                        styles.fill,
                        {
                            backgroundColor: colors.accent,
                            width: widthAnim.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    // Eyebrow-style label - matches the rest of the system primitives
    // (Eyebrow in anvil.tsx). 11pt, medium weight, 1.6 tracking.
    label: {
        fontSize: 11,
        fontFamily: FontFamily.medium,
        letterSpacing: 1.6,
        marginBottom: 8,
    },
    track: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 3,
    },
});
