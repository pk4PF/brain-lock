import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Sparkle } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { MemoryMatchIll } from '../../src/components/games/GameIllustrations';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { MEMORY_SECONDS } from '../../src/constants/gameDifficulty';

const HUE = GameAccents.memory.hue;

/**
 * Chunky emoji card faces. Reads as "objects" not "icons" - much more
 * screenshot-friendly than thin Lucide outlines, and the colour comes
 * baked into the glyph so the grid pops without per-card tinting.
 *
 * Each emoji also gets a soft tint colour for the matched-state glow so
 * the pair's visual identity persists into the celebration ring.
 */
const EMOJI_POOL: { glyph: string; tint: string }[] = [
  { glyph: '🔥', tint: '#F97316' },
  { glyph: '⭐', tint: '#EAB308' },
  { glyph: '💎', tint: '#06B6D4' },
  { glyph: '🧠', tint: '#A855F7' },
  { glyph: '⚡', tint: '#F59E0B' },
  { glyph: '🌈', tint: '#EC4899' },
  { glyph: '❤️', tint: '#EF4444' },
  { glyph: '🌟', tint: '#FBBF24' },
  { glyph: '🎯', tint: '#3B82F6' },
];

const PAIRS_PRODUCTION = 8;
const PAIRS_DEMO = 4;

interface Card {
  id: number;
  pairIdx: number;
  flipped: boolean;
  matched: boolean;
}

type State = 'intro' | 'playing' | 'result';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(pairs: number): Card[] {
  const indices: number[] = [];
  for (let i = 0; i < pairs; i++) indices.push(i, i);
  return shuffle(indices).map((pairIdx, id) => ({ id, pairIdx, flipped: false, matched: false }));
}

function creditsForTime(seconds: number): number {
  // Performance-based 2-5 cells. Aligned with the Day-1 plan tier table:
  //   ≤30s → 5,  30-45s → 4,  45-60s → 3,  >60s → 2.
  if (seconds <= 30) return 5;
  if (seconds <= 45) return 4;
  if (seconds <= 60) return 3;
  return 2;
}

function label(seconds: number): string {
  if (seconds < 30) return 'Razor sharp';
  if (seconds < 45) return 'Excellent recall';
  if (seconds < 60) return 'Solid memory';
  return 'Good effort';
}

export default function MemoryScreen() {
  const { colors } = useThemeColors();
  const params = useLocalSearchParams<{ demo?: string; pairs?: string }>();
  const isDemo = params.demo === '1';
  const pairs = params.pairs ? Number(params.pairs) : (isDemo ? PAIRS_DEMO : PAIRS_PRODUCTION);

  const { earnReward, completeDailyGame, setDemoGameScore, recordCognitiveScore, recordGame } = useStore();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();

  const [gameState, setGameState] = useState<State>('intro');
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(pairs));
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  const lockRef = useRef(false);
  const flippedIdsRef = useRef<number[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (gameState !== 'playing') {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    const start = Date.now();
    setStartedAt(start);
    tickRef.current = setInterval(() => setElapsedMs(Date.now() - start), 100);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [gameState]);

  const handleStart = () => {
    hapticMedium();
    track(Events.GameStarted, { game: 'memory', pairs, demo: isDemo });
    setDeck(buildDeck(pairs));
    setFlippedIds([]);
    flippedIdsRef.current = [];
    lockRef.current = false;
    setMoves(0);
    setElapsedMs(0);
    setGameState('playing');
  };

  const handleFlip = (id: number) => {
    if (lockRef.current) return;
    const card = deck.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (flippedIdsRef.current.includes(id)) return;
    hapticLight();
    const newDeck = deck.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    const newFlipped = [...flippedIdsRef.current, id];
    flippedIdsRef.current = newFlipped;
    setDeck(newDeck);
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      setMoves((m) => m + 1);
      const [a, b] = newFlipped.map((fid) => newDeck.find((c) => c.id === fid)!);
      if (a.pairIdx === b.pairIdx) {
        setTimeout(() => {
          setDeck((d) => d.map((c) => (c.id === a.id || c.id === b.id ? { ...c, matched: true } : c)));
          setFlippedIds([]);
          flippedIdsRef.current = [];
          lockRef.current = false;
          hapticMedium();
          const remaining = newDeck.filter((c) => !c.matched && c.id !== a.id && c.id !== b.id);
          if (remaining.length === 0) finishGame(Date.now() - startedAt);
        }, 350);
      } else {
        setTimeout(() => {
          setDeck((d) => d.map((c) => (c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c)));
          setFlippedIds([]);
          flippedIdsRef.current = [];
          lockRef.current = false;
        }, 800);
      }
    }
  };

  const finishGame = (durationMs: number) => {
    const seconds = Math.round(durationMs / 1000);
    const credits = isDemo ? 0 : creditsForTime(seconds);
    setEarnedCredits(credits);
    setElapsedMs(durationMs);
    setGameState('result');
    if (isDemo) setDemoGameScore(seconds);
    else {
      const passed = seconds <= MEMORY_SECONDS[difficulty];
      // completeDailyGame internally calls earnReward - don't double-award.
      if (passed) doUnlock(); // pass → unlock apps (no-op in practice)
      setResultMsg(pickResultMessage(passed));
      // Memory map: 30s = 100, 90s = 0. Floor at 0.
      const memoryScore = Math.max(0, Math.min(100, 100 - (seconds - 30) * (100 / 60)));
      recordCognitiveScore('memory', memoryScore);
      // Lifetime tile-stat counter - drives the "X played" strip on the games tab.
      recordGame('memory', passed, seconds);
      track(Events.GameCompleted, { game: 'memory', seconds, moves, passed, credits: passed ? credits : 0 });
    }
  };

  const continueAfterDemo = () => router.push('/onboarding/demo-spend');
  const goHome = () => router.replace('/(tabs)');

  const seconds = Math.floor(elapsedMs / 1000);
  const finishedSeconds = Math.round(elapsedMs / 1000);

  // ── INTRO ──
  if (gameState === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Memory" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<MemoryMatchIll size={88} />}
          title="Memory Match"
          blurb="Flip cards to find matching pairs. Faster wins more brain cells."
          rules={[`🎴 ${pairs} pairs`, '👆 Tap to flip', '⏱️ Race the clock']}
          startLabel="Start"
          onStart={handleStart}
          isDemo={isDemo}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (gameState === 'result') {
    const passed = isDemo ? true : finishedSeconds <= MEMORY_SECONDS[difficulty];
    const resultHue = !isDemo && !passed ? '#EF4444' : HUE;
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Memory" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Sparkle size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
          title={isDemo ? label(finishedSeconds) : resultMsg.title}
          message={isDemo ? undefined : resultMsg.line}
          passed={passed}
          bigStat={finishedSeconds}
          bigStatSuffix="s"
          subtitle={`${moves} ${moves === 1 ? 'move' : 'moves'} · ${pairs} pairs`}
          unlockMinutes={isUnlock && passed ? unlockMinutes : undefined}
          isDemo={isDemo}
          primaryLabel={isDemo ? 'Continue' : 'Done'}
          onPrimary={isDemo ? continueAfterDemo : goHome}
          secondaryLabel={isDemo ? undefined : passed ? 'Play again' : 'Try again'}
          onSecondary={isDemo ? undefined : handleStart}
        />
      </View>
    );
  }

  // ── PLAYING ──
  const cols = 4;
  const matchedPairs = deck.filter((c) => c.matched).length / 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Soft accent-tinted blob behind the grid - adds depth and locks the
          brand color into App Store screenshots. Pure presentation, no
          interaction; the play area sits above it. */}
      <View pointerEvents="none" style={[styles.blob, { backgroundColor: `${HUE}1A` }]} />

      <GameHeader
        title="Memory"
        hue={HUE}
        rightSlot={
          <Text style={[styles.hudLabel, { color: colors.muted }]}>{moves} moves</Text>
        }
      />

      {/* Hero HUD: big timer + per-pair progress dots. The dots fill as
          pairs are matched, giving the player a "glance status" they can't
          miss - and a great visual rhythm in screenshots. */}
      <View style={styles.heroBar}>
        <Text style={[styles.heroTimer, { color: HUE }]}>{seconds}s</Text>
        <View style={styles.dotsRow}>
          {Array.from({ length: pairs }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i < matchedPairs ? HUE : colors.border,
                  transform: [{ scale: i < matchedPairs ? 1 : 0.85 }],
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.playArea}>
        <View style={[styles.grid, { width: cols * CARD_SIZE + (cols - 1) * 10 }]}>
          {deck.map((card) => (
            <CardView key={card.id} card={card} onFlip={handleFlip} />
          ))}
        </View>
      </View>
    </View>
  );
}

function CardView({ card, onFlip }: { card: Card; onFlip: (id: number) => void }) {
  const { colors } = useThemeColors();
  const flipAnim = useRef(new Animated.Value(card.flipped || card.matched ? 180 : 0)).current;
  const matchPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: card.flipped || card.matched ? 180 : 0,
      friction: 8, tension: 80, useNativeDriver: true,
    }).start();
  }, [card.flipped, card.matched]);

  // Match celebration: when a card transitions into the matched state,
  // briefly scale it up + back. Combined with the brighter border and
  // glow this gives the satisfying "click" moment that competitor apps
  // use to make the loop feel rewarding (and looks great in video demos).
  useEffect(() => {
    if (!card.matched) return;
    Animated.sequence([
      Animated.spring(matchPulse, { toValue: 1.12, friction: 4, tension: 180, useNativeDriver: true }),
      Animated.spring(matchPulse, { toValue: 1,    friction: 5, tension: 140, useNativeDriver: true }),
    ]).start();
  }, [card.matched]);

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  const showBack = card.flipped || card.matched;
  const entry = EMOJI_POOL[card.pairIdx] ?? EMOJI_POOL[0];
  const tint = entry.tint;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onFlip(card.id)} style={styles.cardSlot} disabled={card.matched}>
      <Animated.View style={{ flex: 1, transform: [{ scale: matchPulse }] }}>
        {/* Card back - brand-accent tint with a subtle Sparkle glyph. Reads
            as "Brainlock card" rather than a generic puzzle piece. */}
        <Animated.View
          style={[
            styles.cardFace,
            {
              backgroundColor: `${HUE}10`,
              borderColor: `${HUE}33`,
              borderWidth: 1.5,
              transform: [{ rotateY: frontRotate }],
              opacity: showBack ? 0 : 1,
            },
          ]}
        >
          <Sparkle size={26} color={HUE} weight="duotone" duotoneOpacity={0.5} />
        </Animated.View>

        {/* Card face - chunky emoji glyph on a per-pair tinted background.
            Matched state pumps the border up + adds a soft glow ring via
            shadow so the celebration reads even on the locked grid. */}
        <Animated.View
          style={[
            styles.cardFace,
            {
              transform: [{ rotateY: backRotate }],
              opacity: showBack ? 1 : 0,
              backgroundColor: card.matched ? `${tint}2E` : `${tint}14`,
              borderColor: card.matched ? tint : `${tint}66`,
              borderWidth: card.matched ? 2.5 : 1.5,
              shadowColor: card.matched ? tint : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: card.matched ? 0.45 : 0,
              shadowRadius: card.matched ? 12 : 0,
              elevation: card.matched ? 6 : 0,
            },
          ]}
        >
          <Text style={styles.cardEmoji}>{entry.glyph}</Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const CARD_SIZE = 88;

const styles = StyleSheet.create({
  // Soft accent halo behind the grid. Big and offset so it bleeds off the
  // top-right of the screen - gives screenshots a brand-coloured anchor
  // without overwhelming the cards.
  blob: {
    position: 'absolute',
    width: 520, height: 520,
    borderRadius: 260,
    top: -200, right: -200,
    opacity: 0.7,
  },

  hudLabel: { fontSize: 12, fontFamily: FontFamily.medium, letterSpacing: 0.4 },

  // Hero HUD row - large timer flanked by progress dots.
  heroBar: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 18,
    gap: 12,
  },
  heroTimer: {
    fontSize: 56,
    fontFamily: FontFamily.semibold,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    lineHeight: 60,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 10, height: 10,
    borderRadius: 5,
  },

  playArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  cardSlot: { width: CARD_SIZE, height: CARD_SIZE },
  cardFace: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden',
  },
  cardEmoji: {
    fontSize: 44,
    lineHeight: 50,
    textAlign: 'center',
  },
});
