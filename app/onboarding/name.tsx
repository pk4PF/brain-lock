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
import { useStore } from '../../src/store/useStore';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';


const AMBER = '#F5A623';

export default function NameScreen() {
    const [name, setName] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const { setUserName } = useStore();

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
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isFocused]);

    const handleContinue = () => {
        const trimmed = name.trim();
        if (trimmed.length > 0) {
            setUserName(trimmed);
        }
        router.push('/onboarding/struggles');
    };

    const animStyle = (anim: Animated.Value, translateY = 30) => ({
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
        outputRange: ['rgba(245,166,35,0.15)', 'rgba(245,166,35,0.5)'],
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
                        <Animated.View style={[styles.lottieContainer, animStyle(lottieAnim, 20)]}>
                            <LottieView
                                source={require('../../assets/animations/brain.json')}
                                autoPlay
                                loop
                                speed={0.6}
                                style={styles.lottie}
                            />
                        </Animated.View>

                        <Animated.View style={animStyle(titleAnim)}>
                            <Text style={styles.title}>What should we{'\n'}call you?</Text>
                            <Text style={styles.subtitle}>
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
                                },
                            ]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your name"
                                    placeholderTextColor="#9CA3AF"
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
        color: '#1A1A2E',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.3,
        lineHeight: 34,
    },
    subtitle: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.regular,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    inputWrapper: {
        width: '100%',
    },
    inputGlow: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1.5,
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 16,
        elevation: 4,
        backgroundColor: '#FFFFFF',
    },
    input: {
        width: '100%',
        height: 56,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.xl,
        fontSize: FontSize.lg,
        fontFamily: FontFamily.semibold,
        color: '#1A1A2E',
        textAlign: 'center',
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 56,
        alignItems: 'center',
    },
});
