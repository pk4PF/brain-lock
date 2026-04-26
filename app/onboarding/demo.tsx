import { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { FontSize, FontFamily, Spacing, BorderRadius } from '../../src/constants/theme';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useStore } from '../../src/store/useStore';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AMBER = '#F5A623';
const AMBER_DIM = 'rgba(245,166,35,0.08)';
const AMBER_GLOW = 'rgba(245,166,35,0.25)';

// Purple palette from reference
const PURPLE = '#7B5EA7';
const PURPLE_DARK = '#5B3F87';
const PURPLE_DEEPER = '#4A3070';
const PURPLE_LIGHT = 'rgba(123,94,167,0.4)';

const GRID_SIZE = 3;
const DEMO_ROUNDS = 4;
const TILE_GAP = 12;
const GRID_PADDING = 36;
const TILE_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - TILE_GAP * (GRID_SIZE - 1)) / GRID_SIZE;

type Phase = 'intro' | 'showing' | 'input' | 'feedback' | 'result';

export default function DemoScreen() {
    const { setDemoGameScore } = useStore();
    const { colors } = useThemeColors();

    const [phase, setPhase] = useState<Phase>('intro');
    const [round, setRound] = useState(0);
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerInput, setPlayerInput] = useState<number[]>([]);
    const [correct, setCorrect] = useState(0);
    const [totalTimeMs, setTotalTimeMs] = useState(0);
    const [activeTile, setActiveTile] = useState<number | null>(null);
    const [feedbackTile, setFeedbackTile] = useState<{ idx: number; ok: boolean } | null>(null);

    const startTimeRef = useRef<number>(0);
    const correctRef = useRef(0);
    correctRef.current = correct;

    // Intro animations
    const introIconAnim = useRef(new Animated.Value(0)).current;
    const introTitleAnim = useRef(new Animated.Value(0)).current;
    const introButtonAnim = useRef(new Animated.Value(0)).current;

    // Game animations
    const gridAnim = useRef(new Animated.Value(0)).current;

    // Tile bounce animations
    const tileAnims = useRef(
        Array.from({ length: GRID_SIZE * GRID_SIZE }, () => new Animated.Value(1))
    ).current;

    // Result animations
    const resultAnim = useRef(new Animated.Value(0)).current;

    // ── Intro entrance ──
    useEffect(() => {
        if (phase === 'intro') {
            Animated.stagger(120, [
                Animated.spring(introIconAnim, {
                    toValue: 1, friction: 6, tension: 50, useNativeDriver: true,
                }),
                Animated.spring(introTitleAnim, {
                    toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
                }),
                Animated.spring(introButtonAnim, {
                    toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
                }),
            ]).start();
        }
    }, [phase]);

    const generateSequence = useCallback((roundNum: number) => {
        const len = roundNum + 2;
        const seq: number[] = [];
        while (seq.length < len) {
            const tile = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
            if (seq.length === 0 || seq[seq.length - 1] !== tile) {
                seq.push(tile);
            }
        }
        return seq;
    }, []);

    const showSequence = useCallback((seq: number[]) => {
        setPhase('showing');
        setActiveTile(null);

        seq.forEach((tile, i) => {
            setTimeout(() => setActiveTile(tile), i * 600);
            setTimeout(() => setActiveTile(null), i * 600 + 400);
        });

        setTimeout(() => {
            setActiveTile(null);
            setPhase('input');
        }, seq.length * 600 + 200);
    }, []);

    const startRound = useCallback((roundNum: number) => {
        const seq = generateSequence(roundNum);
        setSequence(seq);
        setPlayerInput([]);
        setFeedbackTile(null);
        setRound(roundNum);
        setTimeout(() => showSequence(seq), 400);
    }, [generateSequence, showSequence]);

    const handleTileTap = (tileIdx: number) => {
        if (phase !== 'input') return;

        // Bounce animation on tap
        Animated.sequence([
            Animated.timing(tileAnims[tileIdx], {
                toValue: 0.9, duration: 80, useNativeDriver: true,
            }),
            Animated.spring(tileAnims[tileIdx], {
                toValue: 1, friction: 4, tension: 100, useNativeDriver: true,
            }),
        ]).start();

        const stepIndex = playerInput.length;
        const isRight = sequence[stepIndex] === tileIdx;

        setFeedbackTile({ idx: tileIdx, ok: isRight });
        setTimeout(() => setFeedbackTile(null), 300);

        if (!isRight) {
            setTimeout(() => {
                if (round >= DEMO_ROUNDS) {
                    finishGame(correctRef.current);
                } else {
                    startRound(round + 1);
                }
            }, 500);
            return;
        }

        const newInput = [...playerInput, tileIdx];
        setPlayerInput(newInput);

        if (newInput.length === sequence.length) {
            const newCorrect = correct + 1;
            setCorrect(newCorrect);
            correctRef.current = newCorrect;

            setTimeout(() => {
                if (round >= DEMO_ROUNDS) {
                    finishGame(newCorrect);
                } else {
                    startRound(round + 1);
                }
            }, 500);
        }
    };

    const handleStartGame = () => {
        startTimeRef.current = Date.now();
        gridAnim.setValue(0);
        Animated.spring(gridAnim, {
            toValue: 1, friction: 8, tension: 60, useNativeDriver: true,
        }).start();
        startRound(1);
    };

    const finishGame = (finalCorrect: number) => {
        const elapsed = Date.now() - startTimeRef.current;
        setTotalTimeMs(elapsed);
        setDemoGameScore(finalCorrect);
        setPhase('result');

        Animated.spring(resultAnim, {
            toValue: 1, friction: 6, tension: 50, useNativeDriver: true,
        }).start();
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

    const totalSeconds = Math.round(totalTimeMs / 1000);

    // ─── INTRO PHASE ───
    if (phase === 'intro') {
        return (
            <OnboardingLayout>
                <OnboardingBackButton />
                <View style={styles.content}>
                    <View style={styles.centerSection}>
                        {/* Rocket Lottie animation */}
                        <Animated.View style={[styles.introLottieContainer, {
                            opacity: introIconAnim,
                            transform: [{
                                scale: introIconAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 1],
                                }),
                            }],
                        }]}>
                            <LottieView
                                source={require('../../assets/animations/rocket.json')}
                                autoPlay
                                loop
                                speed={0.7}
                                style={styles.introLottie}
                            />
                        </Animated.View>
                        <Animated.View style={animStyle(introTitleAnim)}>
                            <Text style={[styles.introTitle, { color: colors.text }]}>
                                Let's try a quick{'\n'}challenge!
                            </Text>
                            <Text style={[styles.introSubtitle, { color: colors.muted }]}>
                                Watch the tiles light up, then{'\n'}tap them back in order.
                            </Text>
                        </Animated.View>
                    </View>
                    <Animated.View style={[styles.bottomContainer, animStyle(introButtonAnim)]}>
                        <OnboardingButton label="Start" onPress={handleStartGame} />
                    </Animated.View>
                </View>
            </OnboardingLayout>
        );
    }

    // ─── RESULT PHASE ───
    if (phase === 'result') {
        return (
            <OnboardingLayout>
                <View style={styles.content}>
                    <View style={styles.centerSection}>
                        {/* Full-screen confetti */}
                        <LottieView
                            source={require('../../assets/animations/confetti.json')}
                            autoPlay
                            loop={false}
                            style={styles.confetti}
                        />
                        <Animated.View
                            style={[
                                styles.resultContent,
                                {
                                    opacity: resultAnim,
                                    transform: [{
                                        scale: resultAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.7, 1],
                                        }),
                                    }],
                                },
                            ]}
                        >
                            {/* Large success animation */}
                            <LottieView
                                source={require('../../assets/animations/success.json')}
                                autoPlay
                                loop={false}
                                style={styles.successLottie}
                            />
                            <Text style={[styles.resultTitle, { color: colors.text }]}>Amazing!</Text>

                            {/* Stats */}
                            <View style={[styles.resultStatsRow, { backgroundColor: colors.card, borderColor: colors.accentLight }]}>
                                <View style={styles.resultStat}>
                                    <Text style={[styles.resultStatValue, { color: colors.accent }]}>
                                        {correct}/{DEMO_ROUNDS}
                                    </Text>
                                    <Text style={[styles.resultStatLabel, { color: colors.muted }]}>Correct</Text>
                                </View>
                                <View style={[styles.resultStatDivider, { backgroundColor: colors.border }]} />
                                <View style={styles.resultStat}>
                                    <Text style={[styles.resultStatValue, { color: colors.accent }]}>
                                        {totalSeconds}s
                                    </Text>
                                    <Text style={[styles.resultStatLabel, { color: colors.muted }]}>Total Time</Text>
                                </View>
                            </View>

                            {/* Flame streak preview */}
                            <View style={styles.streakPreview}>
                                <LottieView
                                    source={require('../../assets/animations/flame.json')}
                                    autoPlay
                                    loop
                                    speed={0.8}
                                    style={styles.streakFlame}
                                />
                                <Text style={[styles.streakText, { color: colors.secondary }]}>
                                    That took just {totalSeconds}s. Imagine doing{'\n'}this every time you reach for an app!
                                </Text>
                            </View>
                        </Animated.View>
                    </View>
                    <Animated.View
                        style={[
                            styles.bottomContainer,
                            {
                                opacity: resultAnim,
                                transform: [{
                                    translateY: resultAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [30, 0],
                                    }),
                                }],
                            },
                        ]}
                    >
                        <OnboardingButton
                            label="Continue"
                            onPress={() => router.push('/onboarding/letsgo')}
                        />
                    </Animated.View>
                </View>
            </OnboardingLayout>
        );
    }

    // ─── GAME PHASE ───
    const isShowingPhase = phase === 'showing';

    return (
        <View style={styles.gameContainer}>
            {/* Decorative background shapes */}
            <View style={styles.bgDecoTL} />
            <View style={styles.bgDecoBR} />
            <View style={styles.bgDecoMid} />
            {/* Subtle diagonal lines */}
            <View style={styles.bgLine1} />
            <View style={styles.bgLine2} />
            <View style={styles.bgLine3} />

            <View style={styles.gameHeader}>
                <View style={styles.headerPill}>
                    <Text style={styles.roundText}>Level {round} / {DEMO_ROUNDS}</Text>
                </View>
                <Text style={styles.phaseText}>
                    {isShowingPhase ? 'Watch carefully...' : 'Your turn!'}
                </Text>
            </View>

            <View style={styles.dotsRow}>
                {sequence.map((_, i) => (
                    <View
                        key={i}
                        style={[styles.dot, i < playerInput.length && styles.dotFilled]}
                    />
                ))}
            </View>

            <Animated.View
                style={[
                    styles.gridContainer,
                    {
                        opacity: gridAnim,
                        transform: [{
                            scale: gridAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.9, 1],
                            }),
                        }],
                    },
                ]}
            >
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                    const isActive = activeTile === idx;
                    const isFeedbackOk = feedbackTile?.idx === idx && feedbackTile.ok;
                    const isFeedbackBad = feedbackTile?.idx === idx && !feedbackTile.ok;

                    let tileBg = 'rgba(255,255,255,0.12)';
                    let tileBorder = 'rgba(255,255,255,0.25)';
                    let tileShadowOpacity = 0;

                    if (isActive) {
                        tileBg = 'rgba(255,255,255,0.85)';
                        tileBorder = '#FFFFFF';
                        tileShadowOpacity = 0.3;
                    } else if (isFeedbackOk) {
                        tileBg = 'rgba(52,211,153,0.5)';
                        tileBorder = '#34D399';
                        tileShadowOpacity = 0.2;
                    } else if (isFeedbackBad) {
                        tileBg = 'rgba(239,68,68,0.5)';
                        tileBorder = '#EF4444';
                        tileShadowOpacity = 0.2;
                    }

                    return (
                        <Animated.View
                            key={idx}
                            style={{ transform: [{ scale: tileAnims[idx] }] }}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.tile,
                                    {
                                        backgroundColor: tileBg,
                                        borderColor: tileBorder,
                                        shadowOpacity: tileShadowOpacity,
                                    },
                                ]}
                                onPress={() => handleTileTap(idx)}
                                activeOpacity={0.7}
                                disabled={phase !== 'input'}
                            />
                        </Animated.View>
                    );
                })}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    centerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },

    // ─── INTRO ───
    introLottieContainer: {
        marginBottom: 20,
    },
    introLottie: {
        width: 140,
        height: 140,
    },
    introTitle: {
        fontSize: 28,
        fontFamily: FontFamily.bold,
        color: '#1A1A2E',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.3,
        lineHeight: 34,
    },
    introSubtitle: {
        fontSize: FontSize.md,
        fontFamily: FontFamily.regular,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 24,
    },

    // ─── GAME ───
    gameContainer: {
        flex: 1,
        backgroundColor: PURPLE_DARK,
        paddingTop: 70,
    },
    // Decorative background shapes
    bgDecoTL: {
        position: 'absolute',
        top: -SCREEN_HEIGHT * 0.05,
        left: -SCREEN_WIDTH * 0.15,
        width: SCREEN_WIDTH * 0.55,
        height: SCREEN_WIDTH * 0.55,
        borderRadius: SCREEN_WIDTH * 0.275,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    bgDecoBR: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.05,
        right: -SCREEN_WIDTH * 0.1,
        width: SCREEN_WIDTH * 0.5,
        height: SCREEN_WIDTH * 0.5,
        borderRadius: SCREEN_WIDTH * 0.25,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    bgDecoMid: {
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.3,
        right: -SCREEN_WIDTH * 0.08,
        width: SCREEN_WIDTH * 0.35,
        height: SCREEN_WIDTH * 0.35,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        transform: [{ rotate: '25deg' }],
    },
    bgLine1: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.08,
        left: SCREEN_WIDTH * 0.06,
        width: 3,
        height: 28,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.08)',
        transform: [{ rotate: '-30deg' }],
    },
    bgLine2: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.08,
        left: SCREEN_WIDTH * 0.06 + 10,
        width: 3,
        height: 20,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.06)',
        transform: [{ rotate: '-30deg' }],
    },
    bgLine3: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.08,
        left: SCREEN_WIDTH * 0.06 + 20,
        width: 3,
        height: 24,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.07)',
        transform: [{ rotate: '-30deg' }],
    },
    gameHeader: {
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: 20,
    },
    headerPill: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 999,
        marginBottom: 12,
    },
    roundText: {
        fontSize: FontSize.sm,
        fontFamily: FontFamily.semibold,
        color: 'rgba(255,255,255,0.7)',
    },
    phaseText: {
        fontSize: 22,
        fontFamily: FontFamily.bold,
        color: '#FFFFFF',
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 36,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    dotFilled: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: GRID_PADDING,
        gap: TILE_GAP,
        justifyContent: 'center',
    },
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: 12,
        borderWidth: 1.5,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 12,
        elevation: 0,
    },

    // ─── RESULT ───
    confetti: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    resultContent: {
        alignItems: 'center',
    },
    successLottie: {
        width: 140,
        height: 140,
        marginBottom: 12,
    },
    resultTitle: {
        fontSize: 36,
        fontFamily: FontFamily.heavy,
        color: '#1A1A2E',
        textAlign: 'center',
        marginBottom: 24,
    },
    resultStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderWidth: 1,
        borderColor: 'rgba(245,166,35,0.12)',
        shadowColor: '#F5A623',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 4,
        marginBottom: 20,
    },
    resultStat: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    resultStatValue: {
        fontSize: 30,
        fontFamily: FontFamily.heavy,
        color: AMBER,
        marginBottom: 4,
    },
    resultStatLabel: {
        fontSize: FontSize.sm,
        fontFamily: FontFamily.semibold,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    resultStatDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#E5E7EB',
    },
    streakPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 8,
    },
    streakFlame: {
        width: 36,
        height: 36,
    },
    streakText: {
        flex: 1,
        fontSize: FontSize.sm,
        fontFamily: FontFamily.medium,
        color: '#6B7280',
        lineHeight: 20,
    },

    bottomContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 56,
        alignItems: 'center',
    },
});
