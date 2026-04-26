import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Animated,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { FontSize, FontFamily, Spacing, BorderRadius } from '../../src/constants/theme';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useStore } from '../../src/store/useStore';
import { track, Events, identify } from '../../src/services/analytics';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';

export default function NameScreen() {
    const [name, setName] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const { setUserName } = useStore();
    const { colors } = useThemeColors();

    // Entrance animations
    const lottieAnim = useRef(new Animated.Value(0)).current;
    const titleAnim = useRef(new Animated.Value(0)).current;
    const inputAnim = useRef(new Animated.Value(0)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;

    // Input glow
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(120, [
            Animated.spring(lottieAnim, {
                toValue: 1, friction: 6, tension: 50, useNativeDriver: true,
            }),
            Animated.spring(titleAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }),
            Animated.spring(inputAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }),
            Animated.spring(buttonAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Animate glow on focus
    useEffect(() => {
        Animated.timing(glowAnim, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused]);

    const handleContinue = () => {
        const trimmed = name.trim();
        if (trimmed.length > 0) {
            setUserName(trimmed);
            track(Events.NameEntered, { length: trimmed.length });
            identify(trimmed, { userName: trimmed });
        }
        router.push('/onboarding/age');
    };

    const animStyle = (anim: Animated.Value, translateY = 32) => ({
        opacity: anim,
        transform: [{
            translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [translateY, 0],
            }),
        }],
    });

    const inputBorderColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.accentLight, colors.accentGlow],
    });

    const inputShadowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.15],
    });

    return (
        <OnboardingLayout>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={styles.content}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.topSection}>
                        {/* Brain Lottie animation */}
                        <Animated.View style={[styles.lottieContainer, animStyle(lottieAnim, 24)]}>
                            <LottieView
                                source={require('../../assets/animations/brain.json')}
                                autoPlay
                                loop
                                speed={0.6}
                                style={styles.lottie}
                            />
                        </Animated.View>

                        <Animated.View style={animStyle(titleAnim)}>
                            <Text style={[styles.title, { color: colors.text }]}>What should we{'\n'}call you?</Text>
                            <Text style={[styles.subtitle, { color: colors.muted }]}>
                                We'll use this to personalize your experience
                            </Text>
                        </Animated.View>

                        <Animated.View style={[
                            styles.inputWrapper,
                            animStyle(inputAnim),
                        ]}>
                            <Animated.View style={[
                                styles.inputGlow,
                                {
                                    borderColor: inputBorderColor,
                                    shadowOpacity: inputShadowOpacity,
                                    shadowColor: colors.accent,
                                    backgroundColor: colors.card,
                                },
                            ]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Enter your name"
                                    placeholderTextColor={colors.muted}
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    maxLength={20}
                                    returnKeyType="done"
                                    onSubmitEditing={handleContinue}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                />
                            </Animated.View>
                        </Animated.View>
                    </View>

                    <Animated.View style={[styles.bottomContainer, animStyle(buttonAnim)]}>
                        <OnboardingButton
                            label="Continue"
                            onPress={handleContinue}
                        />
                    </Animated.View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </OnboardingLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    lottieContainer: {
        marginBottom: 16,
    },
    lottie: {
        width: 100,
        height: 100,
    },
    title: {
        fontSize: 28,
        fontFamily: FontFamily.bold,
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.3,
        lineHeight: 34,
    },
    subtitle: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.regular,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    inputWrapper: {
        width: '100%',
    },
    inputGlow: {
        borderRadius: 12,
        borderWidth: 1.5,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 16,
        elevation: 4,
    },
    input: {
        width: '100%',
        height: 48,
        borderRadius: 12,
        paddingHorizontal: Spacing.xl,
        fontSize: FontSize.lg,
        fontFamily: FontFamily.semibold,
        textAlign: 'center',
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 48,
        alignItems: 'center',
    },
});
