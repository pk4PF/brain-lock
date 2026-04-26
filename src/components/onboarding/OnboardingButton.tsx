import { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontSize, FontFamily } from '../../constants/theme';
import { useThemeColors } from '../../hooks/useThemeColors';

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
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const { colors } = useThemeColors();

    // Subtle idle breathing pulse
    useEffect(() => {
        if (variant !== 'primary') return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.015, duration: 1400, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
            ])
        );
        const t = setTimeout(() => pulse.start(), 800);
        return () => { clearTimeout(t); pulse.stop(); };
    }, [variant]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
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
                <Text style={[styles.secondaryButtonText, { color: colors.muted }]}>{label}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <Animated.View style={[{ transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }] }, { width: '100%' }]}>
            <TouchableOpacity
                style={[styles.button, style]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#F5A623', '#FF6B35']}
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
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonInner: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    buttonText: {
        color: '#0A0A0F',
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
        fontSize: FontSize.md,
        fontFamily: FontFamily.semibold,
    },
});
