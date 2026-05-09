import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { PuzzlePiece, Sparkle } from 'phosphor-react-native';
import { Heart, Zap, Target, Sparkles, Flame, Brain, Star, Sun, Moon } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { MemoryMatchIll } from '../../src/components/games/GameIllustrations';

const HUE = GameAccents.memory.hue;

const ICON_POOL: { icon: LucideIcon; color: string }[] = [
  { icon: Heart,    color: '#EF4444' },
  { icon: Zap,      color: '#F59E0B' },
  { icon: Target,   color: '#3B82F6' },
  { icon: Sparkles, color: '#A855F7' },
  { icon: Flame,    color: '#F97316' },
  { icon: Brain,    color: '#10B981' },
  { icon: Star,     color: '#EAB308' },
  { icon: Sun,      color: '#F59E0B' },
  { icon: Moon,     color: '#6366F1' },
];

const PAIRS_PRODUCTION = 6;
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

  const [gameState, setGameState] = useState<State>('intro');
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(pairs));
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [earnedCredits, setEarnedCredits] = useState(0);

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
      // completeDailyGame internally calls earnReward - don't double-award.
      completeDailyGame(credits);
      // Memory map: 30s = 100, 90s = 0. Floor at 0.
      const memoryScore = Math.max(0, Math.min(100, 100 - (seconds - 30) * (100 / 60)));
      recordCognitiveScore('memory', memoryScore);
      // Lifetime tile-stat counter — drives the "X played" strip on the games tab.
      recordGame('memory', true, seconds);
      track(Events.GameCompleted, { game: 'memory', seconds, moves, credits });
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
          rules={[`${pairs} pairs`, 'Tap to flip', 'Race the clock']}
          startLabel="Start"
          onStart={handleStart}
          isDemo={isDemo}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (gameState === 'result') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Memory" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Sparkle size={36} color={HUE} weight="duotone" duotoneColor={HUE} duotoneOpacity={0.32} />}
          title={label(finishedSeconds)}
          bigStat={finishedSeconds}
          bigStatSuffix="s"
          subtitle={`${moves} ${moves === 1 ? 'move' : 'moves'} · ${pairs} pairs`}
          credits={earnedCredits}
          isDemo={isDemo}
          primaryLabel={isDemo ? 'Continue' : 'Done'}
          onPrimary={isDemo ? continueAfterDemo : goHome}
          secondaryLabel={isDemo ? undefined : 'Play again'}
          onSecondary={isDemo ? undefined : handleStart}
        />
      </View>
    );
  }

  // ── PLAYING ──
  const cardCount = deck.length;
  const cols = 4;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader
        title="Memory"
        hue={HUE}
        rightSlot={
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.hudVal, { color: HUE }]}>{seconds}s</Text>
            <Text style={[styles.hudLabel, { color: colors.muted }]}>{moves} moves</Text>
          </View>
        }
      />
      <View style={styles.playArea}>
        <View style={[styles.grid, { width: cols * 76 + (cols - 1) * 10 }]}>
          {deck.map((card) => (
            <CardView key={card.id} card={card} onFlip={handleFlip} />
          ))}
        </View>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Find all the pairs to finish
        </Text>
      </View>
    </View>
  );
}

function CardView({ card, onFlip }: { card: Card; onFlip: (id: number) => void }) {
  const { colors } = useThemeColors();
  const flipAnim = useRef(new Animated.Value(card.flipped || card.matched ? 180 : 0)).current;

  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: card.flipped || card.matched ? 180 : 0,
      friction: 8, tension: 80, useNativeDriver: true,
    }).start();
  }, [card.flipped, card.matched]);

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  const showBack = card.flipped || card.matched;
  const Icon = ICON_POOL[card.pairIdx]?.icon ?? Brain;
  const iconColor = ICON_POOL[card.pairIdx]?.color ?? HUE;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onFlip(card.id)} style={styles.cardSlot} disabled={card.matched}>
      <Animated.View
        style={[
          styles.cardFace,
          { backgroundColor: colors.cardAlt, borderColor: colors.border, borderWidth: 1,
            transform: [{ rotateY: frontRotate }], opacity: showBack ? 0 : 1 },
        ]}
      >
        <PuzzlePiece size={22} color={colors.muted} weight="duotone" duotoneOpacity={0.4} />
      </Animated.View>

      <Animated.View
        style={[
          styles.cardFace,
          {
            transform: [{ rotateY: backRotate }],
            opacity: showBack ? 1 : 0,
            backgroundColor: card.matched ? `${iconColor}24` : `${iconColor}10`,
            borderColor: card.matched ? iconColor : `${iconColor}55`,
            borderWidth: card.matched ? 2 : 1.5,
          },
        ]}
      >
        {/* Filled symbol reads as a "thing" rather than a thin icon —
            closer to Unrot's "Memo" cards. Heart/Star/Sun take fill via
            a Lucide fill prop. */}
        <Icon size={44} color={iconColor} strokeWidth={2.2} fill={iconColor} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const CARD_SIZE = 76;

const styles = StyleSheet.create({
  hudVal: { fontSize: 18, fontFamily: FontFamily.semibold, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  hudLabel: { fontSize: 11, fontFamily: FontFamily.medium, letterSpacing: 0.4 },
  playArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  cardSlot: { width: CARD_SIZE, height: CARD_SIZE },
  cardFace: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden',
  },
  hint: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 28 },
});
