import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { FontSize, FontFamily, Spacing, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';

const AMBER = '#F5A623';

interface Struggle {
    id: string;
    emoji: string;
    label: string;
}

const STRUGGLES: Struggle[] = [
    { id: 'screen_time', emoji: '📱', label: 'Too much screen time' },
    { id: 'social_media', emoji: '📜', label: 'Doomscrolling / Social media' },
    { id: 'focus', emoji: '🎯', label: "Can't focus / Easily distracted" },
    { id: 'procrastination', emoji: '⏰', label: 'Procrastination' },
    { id: 'habits', emoji: '🔄', label: 'Want to build better habits' },
    { id: 'brain_training', emoji: '🧠', label: 'Want to train my brain' },
];

export default function StrugglesScreen() {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const { setUserStruggles } = useStore();

    // Entrance animations
    const headerAnim = useRef(new Animated.Value(0)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;

    // Individual item animations for stagger
    const itemAnims = useRef(STRUGGLES.map(() => new Animated.Value(0))).current;

    // Scale animations for selection bounce
    const scaleAnims = useRef(STRUGGLES.map(() => new Animated.Value(1))).current;

    useEffect(() => {
        // Header first
        Animated.spring(headerAnim, {
            toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
        }).start();

        // Stagger items individually
        setTimeout(() => {
            Animated.stagger(80, itemAnims.map((anim) =>
                Animated.spring(anim, {
                    toValue: 1, friction: 8, tension: 65, useNativeDriver: true,
                })
            )).start();
        }, 150);

        // Button last
        setTimeout(() => {
            Animated.spring(buttonAnim, {
                toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
            }).start();
        }, 150 + STRUGGLES.length * 80 + 100);
    }, []);

    const toggleItem = (id: string, index: number) => {
        // Bounce animation on toggle
        Animated.sequence([
            Animated.timing(scaleAnims[index], {
                toValue: 0.95, duration: 80, useNativeDriver: true,
            }),
            Animated.spring(scaleAnims[index], {
                toValue: 1, friction: 4, tension: 100, useNativeDriver: true,
            }),
        ]).start();

        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleContinue = () => {
        setUserStruggles([...selected]);
        router.push('/onboarding/empathy');
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

    return (
        <OnboardingLayout>
            <OnboardingBackButton />

            <View style={styles.content}>
                <Animated.View style={[styles.headerSection, animStyle(headerAnim)]}>
                    <Text style={styles.title}>What do you{'\n'}struggle with?</Text>
                    <Text style={styles.subtitle}>
                        Select all that apply. This helps us personalize your games.
                    </Text>
                </Animated.View>

                <View style={styles.listSection}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    >
                        {STRUGGLES.map((item, index) => {
                            const isSelected = selected.has(item.id);
                            return (
                                <Animated.View
                                    key={item.id}
                                    style={[
                                        animStyle(itemAnims[index], 20),
                                        { transform: [...(animStyle(itemAnims[index], 20).transform), { scale: scaleAnims[index] }] },
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.itemRow,
                                            isSelected && styles.itemRowSelected,
                                        ]}
                                        onPress={() => toggleItem(item.id, index)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.itemLeft}>
                                            <Text style={styles.itemEmoji}>{item.emoji}</Text>
                                            <Text
                                                style={[
                                                    styles.itemLabel,
                                                    isSelected && styles.itemLabelSelected,
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.checkbox,
                                                isSelected && styles.checkboxSelected,
                                            ]}
                                        >
                                            {isSelected && (
                                                <Check size={14} color="#FFFFFF" strokeWidth={3} />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </ScrollView>
                </View>

                <Animated.View style={[styles.bottomContainer, animStyle(buttonAnim)]}>
                    <OnboardingButton
                        label={
                            selected.size > 0
                                ? `Continue`
                                : 'Select at least one'
                        }
                        onPress={handleContinue}
                    />
                </Animated.View>
            </View>
        </OnboardingLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    headerSection: {
        paddingHorizontal: 32,
        paddingTop: 140,
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 28,
        fontFamily: FontFamily.bold,
        color: '#1A1A2E',
        marginBottom: 8,
        letterSpacing: -0.3,
        lineHeight: 34,
    },
    subtitle: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.regular,
        color: '#9CA3AF',
        lineHeight: 22,
        marginBottom: 0,
    },
    listSection: {
        flex: 1,
        paddingHorizontal: 20,
    },
    listContent: {
        paddingTop: 24,
        paddingBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.lg,
        backgroundColor: '#FFFFFF',
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    itemRowSelected: {
        backgroundColor: 'rgba(245,166,35,0.06)',
        borderColor: 'rgba(245,166,35,0.35)',
        shadowColor: AMBER,
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemEmoji: {
        fontSize: 26,
        marginRight: 14,
    },
    itemLabel: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.semibold,
        color: '#6B7280',
        flex: 1,
    },
    itemLabelSelected: {
        color: '#1A1A2E',
    },
    checkbox: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: AMBER,
        borderColor: AMBER,
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 56,
        alignItems: 'center',
    },
});
