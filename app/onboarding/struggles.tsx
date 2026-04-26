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
import { FontSize, FontFamily, Spacing } from '../../src/constants/theme';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useStore } from '../../src/store/useStore';
import { track, Events, setPersonProperties } from '../../src/services/analytics';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';

interface Struggle {
    id: string;
    emoji: string;
    label: string;
}

const STRUGGLES: Struggle[] = [
    { id: 'screen_time', emoji: '\u{1F4F1}', label: 'Too much screen time' },
    { id: 'attention_span', emoji: '\u{1F3AF}', label: 'Short attention span' },
    { id: 'sharpen_mind', emoji: '\u{1F9E0}', label: 'Want to sharpen my mind' },
    { id: 'better_habits', emoji: '\u{1F3C3}', label: 'Want to build better habits' },
    { id: 'all_above', emoji: '\u2705', label: 'All of the above' },
];

export default function StrugglesScreen() {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const { setUserStruggles } = useStore();
    const { colors, isDark } = useThemeColors();

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

    const individualIds = STRUGGLES.filter((s) => s.id !== 'all_above').map((s) => s.id);

    const toggleItem = (id: string, index: number) => {
        // Bounce animation on toggle
        Animated.sequence([
            Animated.timing(scaleAnims[index], {
                toValue: 0.97, duration: 80, useNativeDriver: true,
            }),
            Animated.spring(scaleAnims[index], {
                toValue: 1, friction: 4, tension: 100, useNativeDriver: true,
            }),
        ]).start();

        setSelected((prev) => {
            const next = new Set(prev);

            if (id === 'all_above') {
                if (next.has('all_above')) {
                    next.clear();
                } else {
                    individualIds.forEach((i) => next.add(i));
                    next.add('all_above');
                }
            } else {
                if (next.has(id)) {
                    next.delete(id);
                    next.delete('all_above');
                } else {
                    next.add(id);
                    if (individualIds.every((i) => next.has(i))) {
                        next.add('all_above');
                    }
                }
            }

            return next;
        });
    };

    const handleContinue = () => {
        const arr = [...selected];
        setUserStruggles(arr);
        track(Events.StrugglesSelected, { struggles: arr });
        setPersonProperties({ userStruggles: arr });
        router.push('/onboarding/empathy');
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

    return (
        <OnboardingLayout>
            <OnboardingBackButton />

            <View style={styles.content}>
                <Animated.View style={[styles.headerSection, animStyle(headerAnim)]}>
                    <Text style={[styles.title, { color: colors.text }]}>What do you{'\n'}struggle with?</Text>
                    <Text style={[styles.subtitle, { color: colors.muted }]}>
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
                                        animStyle(itemAnims[index], 24),
                                        { transform: [...(animStyle(itemAnims[index], 24).transform), { scale: scaleAnims[index] }] },
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.itemRow,
                                            {
                                                backgroundColor: isSelected
                                                    ? (isDark ? colors.accentLight : 'rgba(245,166,35,0.06)')
                                                    : colors.card,
                                                borderColor: isSelected ? colors.accentGlow : colors.accentLight,
                                            },
                                        ]}
                                        onPress={() => toggleItem(item.id, index)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.itemLeft}>
                                            <Text style={styles.itemEmoji}>{item.emoji}</Text>
                                            <Text
                                                style={[
                                                    styles.itemLabel,
                                                    { color: isSelected ? colors.text : colors.secondary },
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.checkbox,
                                                {
                                                    backgroundColor: isSelected ? colors.accent : 'transparent',
                                                    borderColor: isSelected ? colors.accent : colors.border,
                                                },
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
                                ? 'Continue'
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
        marginBottom: 8,
        letterSpacing: -0.3,
        lineHeight: 34,
    },
    subtitle: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.regular,
        lineHeight: 22,
        marginBottom: 0,
    },
    listSection: {
        flex: 1,
        paddingHorizontal: 24,
    },
    listContent: {
        paddingTop: 24,
        paddingBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1.5,
        ...({
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
        }),
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemEmoji: {
        fontSize: 24,
        marginRight: 16,
    },
    itemLabel: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.semibold,
        flex: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 48,
        alignItems: 'center',
    },
});
