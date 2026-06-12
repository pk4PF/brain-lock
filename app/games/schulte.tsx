import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Table } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { soundTap, soundWrong, soundComplete, soundFail } from '../../src/utils/sounds';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult, TimerBar } from '../../src/components/games/GameLayout';
import { SchulteIll } from '../../src/components/games/GameIllustrations';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { SCHULTE_LIMIT } from '../../src/constants/gameDifficulty';

const HUE = GameAccents.schulte.hue;
const COLS = 5;
const TOTAL = COLS * COLS;        // 25 tiles
const WRONG_PENALTY_MS = 2000;    // each wrong tap costs 2s

const { width: SW } = Dimensions.get('window');
const GAP = 8;
const CELL = Math.floor((SW - Spacing.xl * 2 - GAP * (COLS - 1)) / COLS);

type Phase = 'intro' | 'playing' | 'result';

function creditsForSchulte(seconds: number): number {
  // Completion time. Tier: ≤20s → 5, ≤30s → 4, ≤45s → 3, else 2 (only on time-up).
  if (seconds <= 20) return 5;
  if (seconds <= 30) return 4;
  if (seconds <= 45) return 3;
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
 * Beat the Grid (Schulte table). Tap 1→25 in order on a scrambled grid before
 * the clock runs out. Wrong taps cost time. The ticking countdown is the hook -
 * run out and you stay locked. Used by speed-readers to widen visual span.
 */
export default function SchulteScreen() {
  const { colors } = useThemeColors();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();
  const TIME_LIMIT = SCHULTE_LIMIT[difficulty]; // seconds — lower = harder
  const { completeDailyGame, recordGame, recordCognitiveScore, canEarnToday, setShowPaywall } = useStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [numbers, setNumbers] = useState<number[]>([]); // cell index -> number
  const [nextExpected, setNextExpected] = useState(1);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [flashCell, setFlashCell] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const [finalSuccess, setFinalSuccess] = useState(false);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  const startTime = useRef(0);
  const penaltyMs = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTick = () => { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; } };
  useEffect(() => () => { stopTick(); if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  const startGame = () => {
    track(Events.GameStarted, { game: 'schulte' });
    setNumbers(shuffle(Array.from({ length: TOTAL }, (_, i) => i + 1)));
    setNextExpected(1);
    setDone(new Set());
    setWrongCount(0);
    setFlashCell(null);
    setElapsedMs(0);
    penaltyMs.current = 0;
    startTime.current = Date.now();
    setPhase('playing');

    stopTick();
    tickRef.current = setInterval(() => {
      const e = Date.now() - startTime.current + penaltyMs.current;
      setElapsedMs(e);
      if (e >= TIME_LIMIT * 1000) {
        stopTick();
        finishGame(false, 0, 0);
      }
    }, 100);
  };

  const handleTap = (cell: number) => {
    if (phase !== 'playing') return;
    if (done.has(cell)) return;
    const num = numbers[cell];

    if (num !== nextExpected) {
      // Wrong - flash + time penalty, but keep going.
      hapticMedium();
      soundWrong();
      penaltyMs.current += WRONG_PENALTY_MS;
      setWrongCount((w) => w + 1);
      setFlashCell(cell);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlashCell(null), 260);
      return;
    }

    hapticLight();
    soundTap();
    const newDone = new Set(done);
    newDone.add(cell);
    setDone(newDone);

    if (nextExpected >= TOTAL) {
      stopTick();
      const seconds = (Date.now() - startTime.current + penaltyMs.current) / 1000;
      finishGame(true, seconds, wrongCount);
    } else {
      setNextExpected(nextExpected + 1);
    }
  };

  const finishGame = (success: boolean, seconds: number, wrongs: number) => {
    stopTick();
    const credits = success ? creditsForSchulte(seconds) : 2;
    const passed = success; // win = finish all 25 before the clock runs out
    if (passed) soundComplete(); else soundFail();
    const timeSec = success ? Math.round(seconds * 10) / 10 : TIME_LIMIT;
    recordGame('schulte', passed, timeSec);
    if (passed) doUnlock(); // pass → unlock apps (no-op in practice)
    setResultMsg(pickResultMessage(passed));
    // Attention/processing speed: faster = higher. Time-up keeps partial progress.
    const score = success
      ? Math.max(0, Math.min(100, 100 - (seconds - 18) * 3))
      : (nextExpected - 1) / TOTAL * 55;
    recordCognitiveScore('attention', score);
    setFinalSuccess(success);
    setFinalTime(timeSec);
    setEarnedCredits(credits);
    track(Events.GameCompleted, { game: 'schulte', success, seconds: timeSec, wrong: wrongs, passed, credits: passed ? credits : 0 });
    setPhase('result');
  };

  const goHome = () => router.replace('/(tabs)');

  const remaining = Math.max(0, TIME_LIMIT - elapsedMs / 1000);
  const timerPct = (remaining / TIME_LIMIT) * 100;

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Beat the Grid" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<SchulteIll size={88} />}
          title="Beat the Grid"
          blurb={`Tap 1 to 25 in order, as fast as you can. You have ${TIME_LIMIT} seconds - run out and you stay locked.`}
          rules={['👁️ Visual search', '🔢 Tap 1 → 25', '⏱️ Wrong taps cost time']}
          startLabel="Start"
          onStart={startGame}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const passed = finalSuccess; // win = finished all 25 before the clock
    const resultHue = passed ? HUE : '#EF4444';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Beat the Grid" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Table size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
          passed={passed}
          bigStat={finalSuccess ? finalTime : 'TIME UP'}
          bigStatSuffix={finalSuccess ? 's' : undefined}
          subtitle={`25 tiles · ${wrongCount} wrong ${wrongCount === 1 ? 'tap' : 'taps'}`}
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
        title="Beat the Grid"
        hue={HUE}
        rightSlot={
          <Text style={{ color: remaining < TIME_LIMIT * 0.25 ? '#EF4444' : HUE, fontFamily: FontFamily.semibold, fontSize: 16, fontVariant: ['tabular-nums'] }}>
            {Math.ceil(remaining)}s
          </Text>
        }
      />
      <View style={{ paddingHorizontal: Spacing.xl, paddingTop: 4, paddingBottom: 16 }}>
        <TimerBar percent={timerPct} low={remaining < TIME_LIMIT * 0.25} hue={HUE} />
        <Text style={[styles.target, { color: colors.muted }]}>
          Next: <Text style={{ color: HUE, fontFamily: FontFamily.semibold }}>{nextExpected}</Text>
        </Text>
      </View>
      <View style={styles.board}>
        {numbers.map((num, cell) => {
          const isDone = done.has(cell);
          const isFlash = flashCell === cell;
          return (
            <TouchableOpacity
              key={cell}
              activeOpacity={0.85}
              onPress={() => handleTap(cell)}
              disabled={isDone}
              style={[
                styles.cell,
                {
                  backgroundColor: isFlash ? 'rgba(239,68,68,0.18)' : isDone ? colors.cardAlt : colors.card,
                  borderColor: isFlash ? '#EF4444' : isDone ? colors.border : colors.borderStrong,
                  opacity: isDone ? 0.4 : 1,
                },
              ]}
            >
              <Text style={[styles.cellNum, { color: isDone ? colors.muted : colors.text }]}>{num}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  target: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    marginTop: 12,
    textAlign: 'center',
  },
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
  cellNum: {
    fontSize: Math.round(CELL * 0.36),
    fontFamily: FontFamily.semibold,
    fontVariant: ['tabular-nums'],
  },
});
