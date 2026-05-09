import { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { FontSize, FontFamily } from '../../constants/theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import { hapticMedium } from '../../utils/haptics';

interface OnboardingButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    style?: ViewStyle;
    disabled?: boolean;
}

export default function OnboardingButton({
    label,
    onPress,
    variant = 'primary',
    style,
    disabled = false,
}: OnboardingButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const { colors } = useThemeColors();

    // Subtle idle breathing pulse on the primary variant only.
    useEffect(() => {
        if (variant !== 'primary' || disabled) return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.015, duration: 1400, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
            ]),
        );
        const t = setTimeout(() => pulse.start(), 800);
        return () => {
            clearTimeout(t);
            pulse.stop();
        };
    }, [variant, disabled]);

    const handlePressIn = () => {
        if (disabled) return;
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        if (disabled) return;
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = () => {
        if (disabled) return;
        hapticMedium();
        onPress();
    };

    if (variant === 'secondary') {
        return (
            <TouchableOpacity
                style={[styles.secondaryButton, style]}
                onPress={handlePress}
                activeOpacity={0.7}
                disabled={disabled}
            >
                <Text style={[styles.secondaryButtonText, { color: colors.secondary, opacity: disabled ? 0.5 : 1 }]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    }

    // Primary onboarding CTA. Solid theme accent, matches the rest of the app.
    // No gradient - restraint beats decoration.
    return (
        <Animated.View
            style={[
                { transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }] },
                { width: '100%', opacity: disabled ? 0.5 : 1 },
            ]}
        >
            <TouchableOpacity
                style={[styles.button, style]}
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                disabled={disabled}
            >
                <Animated.View style={[styles.buttonInner, { backgroundColor: colors.accent }]}>
                    <Text style={styles.buttonText}>{label}</Text>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    // Pill-shaped CTA - matches the main app's PillButton geometry.
    // No drop shadow; the accent fill is enough lift.
    button: {
        width: '100%',
        borderRadius: 999,
        overflow: 'hidden',
    },
    buttonInner: {
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: FontSize.md,
        fontFamily: FontFamily.medium,
        letterSpacing: -0.1,
    },
    secondaryButton: {
        width: '100%',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.medium,
    },
});
