import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image, Easing } from 'react-native';
import { router } from 'expo-router';
import { FontFamily } from '../../src/constants/theme';
import { useThemeColors } from '../../src/hooks/useThemeColors';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    const { colors, isDark } = useThemeColors();

    // Logo animations
    const logoScale = useRef(new Animated.Value(0.5)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;

    // Brand text
    const brandOpacity = useRef(new Animated.Value(0)).current;
    const brandTranslateY = useRef(new Animated.Value(24)).current;

    // Tagline
    const taglineOpacity = useRef(new Animated.Value(0)).current;

    // Progress bar
    const progressWidth = useRef(new Animated.Value(0)).current;

    // Ambient orbs
    const orbAnim1 = useRef(new Animated.Value(0)).current;
    const orbAnim2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Phase 1: Ambient orbs fade in
        Animated.parallel([
            Animated.timing(orbAnim1, {
                toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
            Animated.timing(orbAnim2, {
                toValue: 1, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
        ]).start();

        // Phase 2: Logo scales in
        setTimeout(() => {
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1, friction: 6, tension: 50, useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
                }),
            ]).start();
        }, 400);

        // Phase 4: Brand name slides up
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(brandOpacity, {
                    toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
                }),
                Animated.spring(brandTranslateY, {
                    toValue: 0, friction: 10, tension: 50, useNativeDriver: true,
                }),
            ]).start();
        }, 700);

        // Phase 5: Tagline fades in
        setTimeout(() => {
            Animated.timing(taglineOpacity, {
                toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }).start();
        }, 1100);

        // Progress bar
        Animated.timing(progressWidth, {
            toValue: 1, duration: 2800, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: false,
        }).start();

        // Auto-advance
        const navTimer = setTimeout(() => {
            router.replace('/onboarding/intro');
        }, 3000);

        return () => {
            clearTimeout(navTimer);
        };
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Warm ambient orbs */}
            <Animated.View style={[styles.orb1, { opacity: orbAnim1, backgroundColor: isDark ? 'rgba(255,213,79,0.05)' : 'rgba(245,166,35,0.08)' }]} />
            <Animated.View style={[styles.orb2, { opacity: orbAnim2, backgroundColor: isDark ? 'rgba(255,107,53,0.03)' : 'rgba(255,107,53,0.05)' }]} />
            <Animated.View style={[styles.orb3, { opacity: orbAnim1, backgroundColor: isDark ? 'rgba(255,213,79,0.03)' : 'rgba(245,166,35,0.04)' }]} />

            {/* Center content */}
            <View style={styles.center}>
                {/* Mascot */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }],
                            shadowColor: colors.accent,
                        },
                    ]}
                >
                    <Image
                        source={require('../../assets/mascot.png')}
                        style={styles.mascot}
                        resizeMode="contain"
                    />
                </Animated.View>
            </View>

            {/* Brand text */}
            <View style={styles.brandSection}>
                <Animated.View
                    style={{
                        opacity: brandOpacity,
                        transform: [{ translateY: brandTranslateY }],
                    }}
                >
                    <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                        BRAINLOCK
                    </Text>
                </Animated.View>

                <Animated.View style={{ opacity: taglineOpacity }}>
                    <Text style={[styles.tagline, { color: colors.muted }]}>earn your screentime</Text>
                </Animated.View>
            </View>

            {/* Progress bar */}
            <View style={styles.bottomSection}>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                backgroundColor: colors.accent,
                                width: progressWidth.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Warm ambient orbs
    orb1: {
        position: 'absolute',
        top: -height * 0.05,
        left: -width * 0.2,
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: width * 0.35,
    },
    orb2: {
        position: 'absolute',
        bottom: height * 0.05,
        right: -width * 0.15,
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: width * 0.3,
    },
    orb3: {
        position: 'absolute',
        top: height * 0.35,
        right: -width * 0.1,
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: width * 0.2,
    },

    // Center
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    logoContainer: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 40,
        elevation: 16,
    },
    mascot: {
        width: 150,
        height: 150,
    },

    // Brand
    brandSection: {
        position: 'absolute',
        bottom: height * 0.18,
        alignItems: 'center',
        width: '100%',
    },
    brandName: {
        fontSize: 24,
        fontFamily: FontFamily.regular,
        letterSpacing: 12,
        textAlign: 'center',
        paddingLeft: 12,
    },
    tagline: {
        fontSize: 11,
        fontFamily: FontFamily.regular,
        marginTop: 12,
        textAlign: 'center',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },

    // Progress
    bottomSection: {
        position: 'absolute',
        bottom: height * 0.1,
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 80,
    },
    progressTrack: {
        width: 100,
        height: 3,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
});
