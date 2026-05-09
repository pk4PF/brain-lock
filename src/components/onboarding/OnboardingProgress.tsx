import { View, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

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
            <View style={[styles.track, { backgroundColor: colors.cardAlt }]}>
                <Animated.View
                    style={[
                        styles.fill,
                        {
                            backgroundColor: colors.text,
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
    track: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 2,
    },
});
