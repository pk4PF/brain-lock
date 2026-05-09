import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain } from 'phosphor-react-native';
import { Check, X as XIcon } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium, hapticSuccess } from '../../src/utils/haptics';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { ShapeRecallIll } from '../../src/components/games/GameIllustrations';

const HUE = GameAccents['tile-recall'].hue;
// Lighter gradient stop for the lit-tile fill. Same hue, brighter — gives
// each lit tile a saturated face that reads "alive" in screenshots.
const HUE_LIGHT = '#34D6D6';
const GRID = 4;                  // 4x4 = 16 cells
const SHOW_MS = 1800;            // tiles lit duration (production)
const SHOW_MS_DEMO = 2200;       // longer for first-timers
const START_LEVEL = 3;           // tiles in round 1
const MAX_LEVEL = 12;            // up to 12 tiles - elite working-memory territory
const DEMO_LEVELS = [3, 4, 5];   // onboarding demo: three short rounds

// Demo route after the demo run. Lands on demo-earn first (celebration
// "+5 cells" beat with confetti) before demo-spend so the user sees the
// reward moment they just earned before being asked to spend it.
const DEMO_NEXT_ROUTE = '/onboarding/demo-earn';

type Phase = 'intro' | 'show' | 'recall' | 'result';

function creditsForLevel(maxLevel: number): number {
  // Day-1 plan tier table:
  //   level 7+ -> 5,  5+ -> 4,  4+ -> 3,  else 2.
  if (maxLevel >= 7) return 5;
  if (maxLevel >= 5) return 4;
  if (maxLevel >= 4) return 3;
  return 2;
}

/**
 * Memory Tiles - the Corsi block-tapping test. Tiles flash on a 4x4 grid;
 * user has to remember which positions lit up and tap them. Each successful
 * round adds one tile. One mistake ends the game.
 *
 * This is the hero marketing game (see plan: im-gonna-10x-my-streamed-petal.md).
 * It also runs in demo mode during onboarding via ?demo=1, where it plays
 * exactly 2 fixed-difficulty rounds and auto-advances without the regular
 * result screen or daily-credit side-effects.
 *
 * Mechanically distinct from Memory Match (pair-flipping recognition) - this
 * is pure spatial recall, no second look at the pattern.
 */
export default function TileRecallScreen() {
  const { colors } = useThemeColors();
  const params = useLocalSearchParams<{ demo?: string }>();
  const isDemo = params.demo === '1';

  const {
    completeDailyGame, recordGame, recordCognitiveScore,
    canEarnToday, setShowPaywall,
  } = useStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [level, setLevel] = useState(START_LEVEL);
  const [demoStep, setDemoStep] = useState(0); // index into DEMO_LEVELS
  const [demoCorrectTotal, setDemoCorrectTotal] = useState(0);
  const [demoTilesTotal, setDemoTilesTotal] = useState(0);
  const [pattern, setPattern] = useState<Set<number>>(new Set());
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<{ idx: number; right: boolean } | null>(null);
  const [maxLevel, setMaxLevel] = useState(0);
  const [earnedCredits, setEarnedCredits] = useState(0);

  const startTime = useRef(0);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Per-cell opacity animation (0 = idle, 1 = lit). Drives the gradient overlay.
  const cellAnims = useRef(
    Array.from({ length: GRID * GRID }, () => new Animated.Value(0))
  ).current;
  // Per-cell scale animation. Pops the tile by ~6% when it lights up so the
  // pattern reads as alive in screen recordings, not just colour-shifted.
  const scaleAnims = useRef(
    Array.from({ length: GRID * GRID }, () => new Animated.Value(1))
  ).current;

  useEffect(() => () => {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
  }, []);

  const beginRound = useCallback((roundLevel: number) => {
    // Random N distinct cells.
    const next = new Set<number>();
    while (next.size < roundLevel) {
      next.add(Math.floor(Math.random() * GRID * GRID));
    }
    setPattern(next);
    setTapped(new Set());
    setFeedback(null);
    setLevel(roundLevel);
    setPhase('show');

    // Animate each lit cell in: opacity 0→1 + a brief scale pop so the
    // reveal reads as more than just a colour fill.
    Array.from(next).forEach((idx, i) => {
      cellAnims[idx].setValue(0);
      scaleAnims[idx].setValue(1);
      Animated.parallel([
        Animated.timing(cellAnims[idx], {
          toValue: 1,
          duration: 220,
          delay: i * 60,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(i * 60),
          Animated.spring(scaleAnims[idx], {
            toValue: 1.06,
            friction: 5,
            tension: 140,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnims[idx], {
            toValue: 1,
            friction: 6,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    // Hand off to recall phase after the show window.
    const showMs = isDemo ? SHOW_MS_DEMO : SHOW_MS;
    phaseTimerRef.current = setTimeout(() => {
      // Fade lit cells back down.
      Array.from(next).forEach((idx) => {
        Animated.timing(cellAnims[idx], {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      });
      setPhase('recall');
    }, showMs + roundLevel * 60);
  }, [cellAnims, scaleAnims, isDemo]);

  const startGame = () => {
    // Demo mode never paywalls and doesn't burn the daily counter.
    if (!isDemo && !canEarnToday()) { setShowPaywall(true); return; }
    track(Events.GameStarted, { game: 'tile-recall', demo: isDemo });
    setMaxLevel(0);
    setDemoStep(0);
    setDemoCorrectTotal(0);
    setDemoTilesTotal(0);
    startTime.current = Date.now();
    beginRound(isDemo ? DEMO_LEVELS[0] : START_LEVEL);
  };

  const handleCellTap = (idx: number) => {
    if (phase !== 'recall') return;
    if (tapped.has(idx)) return;
    hapticLight();

    const isRight = pattern.has(idx);
    const newTapped = new Set(tapped);
    newTapped.add(idx);
    setTapped(newTapped);

    // Brief flash + scale punch on the tapped cell so the user gets feedback
    // they can feel and see in a screen recording.
    setFeedback({ idx, right: isRight });
    Animated.parallel([
      Animated.sequence([
        Animated.timing(cellAnims[idx], { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(cellAnims[idx], { toValue: 0, duration: 240, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.spring(scaleAnims[idx], { toValue: 0.92, friction: 4, tension: 220, useNativeDriver: true }),
        Animated.spring(scaleAnims[idx], { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      ]),
    ]).start();
    setTimeout(() => setFeedback(null), 260);

    if (!isRight) {
      // Production: end on first wrong tap.
      if (!isDemo) {
        hapticMedium();
        finishGame(maxLevel);
        return;
      }
      // Demo: count it as a miss but keep playing the round so the user
      // actually finishes the demo flow (no "you failed" moment in onboarding).
    }

    // Round complete when user has tapped `level` cells (right or wrong).
    if (newTapped.size >= level) {
      const allRight = Array.from(pattern).every((i) => newTapped.has(i));

      if (isDemo) {
        // Tally for the cognitive baseline score across both demo rounds.
        const correctThisRound = Array.from(newTapped).filter((i) => pattern.has(i)).length;
        const newCorrect = demoCorrectTotal + correctThisRound;
        const newTiles = demoTilesTotal + level;
        setDemoCorrectTotal(newCorrect);
        setDemoTilesTotal(newTiles);

        const nextStep = demoStep + 1;
        if (nextStep >= DEMO_LEVELS.length) {
          finishDemo(newCorrect, newTiles);
        } else {
          setDemoStep(nextStep);
          // Brief pause so the user sees their feedback before next round.
          phaseTimerRef.current = setTimeout(() => beginRound(DEMO_LEVELS[nextStep]), 900);
        }
        return;
      }

      // Production: round complete. If perfect → next level. If any miss → end.
      if (!allRight) {
        finishGame(maxLevel);
        return;
      }
      hapticSuccess();
      const newMax = Math.max(maxLevel, level);
      setMaxLevel(newMax);
      if (level >= MAX_LEVEL) {
        finishGame(newMax);
      } else {
        phaseTimerRef.current = setTimeout(() => beginRound(level + 1), 850);
      }
    }
  };

  const finishGame = (finalMax: number) => {
    if (phaseTimerRef.current) { clearTimeout(phaseTimerRef.current); phaseTimerRef.current = null; }
    const timeTaken = (Date.now() - startTime.current) / 1000;
    const credits = creditsForLevel(finalMax);
    const won = finalMax >= 4;
    recordGame('tile-recall', won, timeTaken);
    completeDailyGame(credits);
    // Memory map: each level cleared = ~12 points. Level 8 = 96.
    recordCognitiveScore('memory', Math.min(100, finalMax * 12));
    setEarnedCredits(credits);
    track(Events.GameCompleted, { game: 'tile-recall', max_level: finalMax, credits });
    setPhase('result');
  };

  const finishDemo = (correct: number, total: number) => {
    if (phaseTimerRef.current) { clearTimeout(phaseTimerRef.current); phaseTimerRef.current = null; }
    // Record a baseline cognitive score so Stats has something to show on
    // first Home landing. The 10% ratchet in recordCognitiveScore will land
    // this around 8-15 in the bar (Warming up tier) - intentional open loop.
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    recordCognitiveScore('memory', pct);
    track(Events.GameCompleted, { game: 'tile-recall', demo: true, correct, total });
    router.push(DEMO_NEXT_ROUTE);
  };

  const goHome = () => router.replace('/(tabs)');

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Memory Tiles" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<ShapeRecallIll size={88} />}
          title="Memory Tiles"
          blurb={
            isDemo
              ? "Tiles will light up. Remember where, then tap those spots."
              : "Tiles flash. Remember where. Tap them back. Each level adds one."
          }
          rules={
            isDemo
              ? ['Spatial memory', '2 quick rounds', 'No wrong answers']
              : ['Spatial memory', `Starts at ${START_LEVEL} tiles`, 'One miss ends it']
          }
          startLabel={isDemo ? 'Try it' : 'Start'}
          onStart={startGame}
          isDemo={isDemo}
        />
      </View>
    );
  }

  // ── RESULT (production only) ──
  if (phase === 'result') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Memory Tiles" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Brain size={36} color={HUE} weight="duotone" duotoneColor={HUE} duotoneOpacity={0.32} />}
          title={
            maxLevel >= 7 ? 'Mind palace' :
            maxLevel >= 5 ? 'Strong recall' :
            maxLevel >= 4 ? 'Solid run' : 'Keep training'
          }
          bigStat={maxLevel}
          bigStatSuffix={maxLevel === 1 ? ' tile' : ' tiles'}
          subtitle="Furthest level cleared"
          credits={earnedCredits}
          primaryLabel="Done"
          onPrimary={goHome}
          secondaryLabel="Play again"
          onSecondary={startGame}
        />
      </View>
    );
  }

  // ── SHOW / RECALL ──
  const headerLabel = phase === 'show' ? 'Watch' : 'Recall';
  const progressLabel = isDemo
    ? `Round ${demoStep + 1} / ${DEMO_LEVELS.length}`
    : `Level ${level - START_LEVEL + 1} - ${level} tiles`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader
        title={headerLabel}
        hue={HUE}
        rightSlot={
          <Text style={{ color: colors.muted, fontFamily: FontFamily.medium, fontSize: 13 }}>
            {progressLabel}
          </Text>
        }
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl }}>
        <Text style={[styles.eyebrow, { color: colors.muted }]}>
          {phase === 'show' ? 'REMEMBER THESE' : 'TAP WHAT YOU SAW'}
        </Text>

        <View style={styles.grid}>
          {Array.from({ length: GRID * GRID }).map((_, i) => {
            const isLit = phase === 'show' && pattern.has(i);
            const isTapped = tapped.has(i);
            const tappedRight = isTapped && pattern.has(i);
            const tappedWrong = isTapped && !pattern.has(i);

            // Flash state colours.
            const rightBg = '#22C55E';
            const wrongBg = '#EF4444';

            // The opacity drives the gradient overlay: 0 = idle, 1 = full
            // colour. Same anim controls show + tap flashes.
            const overlayOpacity = cellAnims[i].interpolate({
              inputRange: [0, 1],
              outputRange: [0, isTapped ? 0.85 : 1],
            });

            // Glow shadow opacity matches the overlay so lit tiles feel like
            // they're casting light onto the surrounding card surface.
            const glowOpacity = cellAnims[i].interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.45],
            });

            // The fill colour for the overlay layer. Tap-right and tap-wrong
            // are flat solid; show-mode is a gradient (rendered below).
            const overlaySolid = tappedRight ? rightBg : tappedWrong ? wrongBg : null;

            return (
              <Animated.View
                key={i}
                style={[
                  styles.cellWrap,
                  {
                    transform: [{ scale: scaleAnims[i] }],
                    // Native iOS shadow — soft elevation on idle so tiles
                    // read as cards, not flat boxes. Coloured shadow when
                    // lit gives the marketing-friendly glow.
                    ...Platform.select({
                      ios: {
                        shadowColor: isLit || tappedRight || tappedWrong
                          ? (tappedWrong ? wrongBg : isLit ? HUE : rightBg)
                          : '#000',
                        shadowOffset: { width: 0, height: isLit ? 6 : 2 },
                        shadowOpacity: isLit ? 0.35 : 0.06,
                        shadowRadius: isLit ? 14 : 4,
                      },
                      android: { elevation: isLit ? 8 : 2 },
                    }),
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={phase !== 'recall' || isTapped}
                  onPress={() => handleCellTap(i)}
                  style={[
                    styles.cell,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  {/* Subtle inner gradient on idle gives each tile a soft
                      face-light without coloring it (idle has to stay neutral
                      so the user can tell which tiles light up). */}
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Lit / flash overlay. Show-mode uses a gradient (richer
                      than flat fill); tap flashes use a solid colour overlay. */}
                  <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}
                  >
                    {overlaySolid ? (
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlaySolid }]} />
                    ) : (
                      <LinearGradient
                        colors={[HUE_LIGHT, HUE]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                  </Animated.View>

                  {/* Glow ring — a fading inner-ish ring that softens the
                      hard edge of the gradient and sells the "alive" feel. */}
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        borderRadius: CELL_RADIUS,
                        borderWidth: 2,
                        borderColor: isLit ? '#FFFFFF' : 'transparent',
                        opacity: glowOpacity,
                      },
                    ]}
                  />

                  {/* Tap feedback icon — sits above the overlay. */}
                  {tappedRight && (
                    <Check size={26} color="#FFFFFF" strokeWidth={3.2} />
                  )}
                  {tappedWrong && (
                    <XIcon size={26} color="#FFFFFF" strokeWidth={3.2} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {phase === 'recall' && (
          <Text style={[styles.hint, { color: colors.muted }]}>
            {tapped.size} / {level}
          </Text>
        )}
      </View>
    </View>
  );
}

const CELL_SIZE = 72;
const CELL_GAP = 12;
const CELL_RADIUS = 18;

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    letterSpacing: 2.0,
    marginBottom: 28,
    textTransform: 'uppercase',
  },
  grid: {
    width: CELL_SIZE * GRID + CELL_GAP * (GRID - 1),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
    justifyContent: 'center',
  },
  // The wrapper holds the shadow / glow + scale transform. The inner cell
  // owns the rounded clip (`overflow: hidden`) so we can layer gradients
  // inside without the shadow getting clipped on iOS.
  cellWrap: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_RADIUS,
  },
  cell: {
    flex: 1,
    borderRadius: CELL_RADIUS,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hint: {
    marginTop: 32,
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
});
