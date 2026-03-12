import { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BorderRadius, FontSize, FontFamily } from '../../constants/theme';

const AMBER = '#E8850C';
const DARK = '#0A0A0F';

interface OnboardingButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    style?: ViewStyle;
}

export default function OnboardingButton({
    label,
    onPress,
    variant = 'primary',
    style,
}: OnboardingButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
        }).start();
    };

    if (variant === 'secondary') {
        return (
            <TouchableOpacity
                style={[styles.secondaryButton, style]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <Text style={styles.secondaryButtonText}>{label}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, { width: '100%' }]}>
            <TouchableOpacity
                style={[styles.button, style]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#E8850C', '#D4700A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonInner}
                >
                    <Text style={styles.buttonText}>{label}</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    buttonInner: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.xl,
    },
    buttonText: {
        color: DARK,
        fontSize: FontSize.lg,
        fontFamily: FontFamily.bold,
        letterSpacing: 0.3,
    },
    secondaryButton: {
        width: '100%',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: '#9CA3AF',
        fontSize: FontSize.md,
        fontFamily: FontFamily.semibold,
    },
});
