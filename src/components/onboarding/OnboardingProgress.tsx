import { View, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface OnboardingProgressProps {
    currentStep: number;
    totalSteps: number;
}

export default function OnboardingProgress({
    currentStep,
    totalSteps,
}: OnboardingProgressProps) {
    const widthAnim = useRef(new Animated.Value(0)).current;

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
            <View style={styles.track}>
                <Animated.View
                    style={[
                        styles.fillContainer,
                        {
                            width: widthAnim.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                >
                    <LinearGradient
                        colors={['#E8850C', '#D4700A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradient}
                    />
                </Animated.View>
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
        height: 5,
        borderRadius: 3,
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
    },
    fillContainer: {
        height: '100%',
        borderRadius: 3,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
    },
});
