import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SortAscending } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { ChimpTestIll } from '../../src/components/games/GameIllustrations';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { CHIMP_LEVEL } from '../../src/constants/gameDifficulty';

const HUE = GameAccents.chimp.hue;
const COLS = 5;
const ROWS = 8;
const CELLS = COLS * ROWS;
const START_COUNT = 4;
const MAX_COUNT = 12;

const { width: SW } = Dimensions.get('window');
const GAP = 8;
const CELL = Math.floor((SW - Spacing.xl * 2 - GAP * (COLS - 1)) / COLS);

type Phase = 'intro' | 'playing' | 'result';

function creditsForChimp(maxCleared: number): number {
  // Highest count fully recalled. Tier:  ≥10 → 5, ≥8 → 4, ≥6 → 3, else 2.
  if (maxCleared >= 10) return 5;
  if (maxCleared >= 8) return 4;
  if (maxCleared >= 6) return 3;
  return 2;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Chimp Test - the Human Benchmark classic. Numbers 1..N appear on a grid;
 * the moment you tap 1, the rest flip to blank tiles and you have to tap them
 * in order from memory. Each cleared level adds one number. One wrong tap ends
 * it. Sudden-death + escalating = a clip that makes viewers hold their breath.
 */
export default function ChimpScreen() {
  const { colors } = useThemeColors();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();
  const { completeDailyGame, recordGame, recordCognitiveScore, canEarnToday, setShowPaywall } = useStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [count, setCount] = useState(START_COUNT);
  // cell index -> number (1..count) for the current round
  const [placements, setPlacements] = useState<Record<number, number>>({});
  const [nextExpected, setNextExpected] = useState(1);
  const [numbersHidden, setNumbersHidden] = useState(false);
  const [cleared, setCleared] = useState<Set<number>>(new Set());
  const [maxCleared, setMaxCleared] = useState(0);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  const startTime = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const beginRound = (n: number) => {
    const cells = shuffle(Array.from({ length: CELLS }, (_, i) => i)).slice(0, n);
    const map: Record<number, number> = {};
    cells.forEach((cell, i) => { map[cell] = i + 1; });
    setPlacements(map);
    setNextExpected(1);
    setNumbersHidden(false);
    setCleared(new Set());
    setPhase('playing');
  };

  const startGame = () => {
    if (!canEarnToday()) { setShowPaywall(true); return; }
    track(Events.GameStarted, { game: 'chimp' });
    setMaxCleared(0);
    setCount(START_COUNT);
    startTime.current = Date.now();
    beginRound(START_COUNT);
  };

  const handleCellTap = (cell: number) => {
    if (phase !== 'playing') return;
    const num = placements[cell];
    if (!num || cleared.has(cell)) return; // empty or already-cleared → ignore

    if (num !== nextExpected) {
      // Wrong order → sudden death.
      hapticMedium();
      finishGame(maxCleared);
      return;
    }

    hapticLight();
    // First correct tap hides every remaining number.
    if (nextExpected === 1) setNumbersHidden(true);
    const newCleared = new Set(cleared);
    newCleared.add(cell);
    setCleared(newCleared);

    if (nextExpected >= count) {
      // Round complete.
      const newMax = Math.max(maxCleared, count);
      setMaxCleared(newMax);
      if (count >= MAX_COUNT) {
        finishGame(newMax);
      } else {
        timerRef.current = setTimeout(() => {
          const next = count + 1;
          setCount(next);
          beginRound(next);
        }, 500);
      }
    } else {
      setNextExpected(nextExpected + 1);
    }
  };

  const finishGame = (finalMax: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const timeTaken = (Date.now() - startTime.current) / 1000;
    const credits = creditsForChimp(finalMax);
    const passed = finalMax >= CHIMP_LEVEL[difficulty];
    recordGame('chimp', passed, timeTaken);
    if (passed) doUnlock(); // pass → unlock apps (no-op in practice)
    setResultMsg(pickResultMessage(passed));
    recordCognitiveScore('memory', Math.min(100, finalMax * 9));
    setEarnedCredits(credits);
    track(Events.GameCompleted, { game: 'chimp', max_cleared: finalMax, passed, credits: passed ? credits : 0 });
    setPhase('result');
  };

  const goHome = () => router.replace('/(tabs)');

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Chimp Test" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<ChimpTestIll size={88} />}
          title="Chimp Test"
          blurb="Numbers flash on the grid. The moment you tap 1, they vanish - tap the rest in order from memory."
          rules={['🧠 Working memory', `▶️ Starts at ${START_COUNT}`, '❌ One slip ends it']}
          startLabel="Start"
          onStart={startGame}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const passed = maxCleared >= CHIMP_LEVEL[difficulty];
    const resultHue = passed ? HUE : '#EF4444';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Chimp Test" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<SortAscending size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
          title={resultMsg.title}
          message={resultMsg.line}
          passed={passed}
          bigStat={maxCleared}
          subtitle="Numbers held in memory"
          unlockMinutes={isUnlock && passed ? unlockMinutes : undefined}
          primaryLabel={passed ? 'Play again' : 'Try again'}
          onPrimary={startGame}
          secondaryLabel="Back to home"
          onSecondary={goHome}
        />
      </View>
    );
  }

  // ── PLAYING ──
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader
        title={numbersHidden ? 'Recall' : 'Memorise'}
        hue={HUE}
        rightSlot={
          <Text style={{ color: colors.muted, fontFamily: FontFamily.medium, fontSize: 13 }}>
            {count} tiles
          </Text>
        }
      />
      <View style={styles.board}>
        {Array.from({ length: CELLS }).map((_, i) => {
          const num = placements[i];
          const isCleared = cleared.has(i);
          if (!num) {
            return <View key={i} style={[styles.cell, styles.cellEmpty]} />;
          }
          const showNumber = !numbersHidden;
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.85}
              onPress={() => handleCellTap(i)}
              disabled={isCleared}
              style={[
                styles.cell,
                {
                  backgroundColor: isCleared ? colors.cardAlt : `${HUE}1F`,
                  borderColor: isCleared ? colors.border : HUE,
                  opacity: isCleared ? 0.35 : 1,
                },
              ]}
            >
              {showNumber && (
                <Text style={[styles.cellNum, { color: HUE }]}>{num}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    alignContent: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  cellNum: {
    fontSize: Math.round(CELL * 0.4),
    fontFamily: FontFamily.semibold,
    fontVariant: ['tabular-nums'],
  },
});
