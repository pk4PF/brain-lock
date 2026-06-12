import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableWithoutFeedback, Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Target } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { soundCorrect, soundWrong, soundComplete, soundFail } from '../../src/utils/sounds';
import { track, Events } from '../../src/services/analytics';
import { advanceBenchmark } from '../../src/utils/benchmark';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { FocusFlashIll } from '../../src/components/games/GameIllustrations';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { passByAccuracy } from '../../src/constants/gameDifficulty';

const HUE = GameAccents.focus.hue;
const NO_GO_DIGIT = 3;
const PRODUCTION_ROUNDS = 40;
const DEMO_ROUNDS = 10;
const SHOW_MS = 850;

type State = 'intro' | 'playing' | 'result';

interface RoundResult { digit: number; tapped: boolean; correct: boolean; }

function creditsForScore(pct: number): number {
  // Performance-based 2-5 cells (Day-1 plan tier table).
  //   100% → 5,  80-99% → 4,  60-79% → 3,  <60% → 2.
  if (pct >= 100) return 5;
  if (pct >= 80) return 4;
  if (pct >= 60) return 3;
  return 2;
}

function label(pct: number): string {
  if (pct >= 90) return 'Laser focus';
  if (pct >= 80) return 'Sharp attention';
  if (pct >= 60) return 'Nice control';
  return 'Keep training';
}

export default function FocusScreen() {
  const { colors } = useThemeColors();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();
  const params = useLocalSearchParams<{ rounds?: string; demo?: string; benchmark?: string; bm?: string }>();
  const isDemo = params.demo === '1';
  const isBenchmark = params.benchmark === '1';
  const bmIndex = Number(params.bm ?? 0);
  const ROUNDS = params.rounds ? Number(params.rounds) : (isDemo ? DEMO_ROUNDS : PRODUCTION_ROUNDS);

  const { earnReward, completeDailyGame, recordFocusScore, setDemoGameScore, recordCognitiveScore, recordGame, setBenchmarkScore } = useStore();

  const [gameState, setGameState] = useState<State>('intro');
  const [roundIdx, setRoundIdx] = useState(0);
  const [currentDigit, setCurrentDigit] = useState<number | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  const tappedThisRoundRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  const nextDigit = useCallback((): number => {
    const want3 = Math.random() < 0.25;
    if (want3) return NO_GO_DIGIT;
    let d: number;
    do { d = Math.floor(Math.random() * 10); } while (d === NO_GO_DIGIT);
    return d;
  }, []);

  const startRound = useCallback(() => {
    tappedThisRoundRef.current = false;
    const d = nextDigit();
    setCurrentDigit(d);

    flashAnim.setValue(0);
    Animated.spring(flashAnim, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start();

    timerRef.current = setTimeout(() => {
      finishRound(d, tappedThisRoundRef.current);
    }, SHOW_MS);
  }, [nextDigit]);

  const finishRound = useCallback((digit: number, tapped: boolean) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    const isNoGo = digit === NO_GO_DIGIT;
    const correct = isNoGo ? !tapped : tapped;
    setResults((prev) => [...prev, { digit, tapped, correct }]);
    setRoundIdx((i) => {
      const next = i + 1;
      if (next >= ROUNDS) setTimeout(() => finishGame(), 50);
      else setTimeout(() => startRound(), 250);
      return next;
    });
    setCurrentDigit(null);
  }, [ROUNDS, startRound]);

  const handleTap = () => {
    if (gameState !== 'playing' || currentDigit === null || tappedThisRoundRef.current) return;
    tappedThisRoundRef.current = true;
    if (currentDigit === NO_GO_DIGIT) { hapticMedium(); soundWrong(); }
    else { hapticLight(); soundCorrect(); }
    finishRound(currentDigit, true);
  };

  const finishGame = () => {
    if (!isBenchmark) setGameState('result');
    setResults((prev) => {
      const correct = prev.filter((r) => r.correct).length;
      const pct = Math.round((correct / ROUNDS) * 100);
      const credits = isDemo ? 0 : creditsForScore(pct);
      setEarnedCredits(credits);
      if (isDemo) { soundComplete(); setDemoGameScore(pct); }
      else {
        const passed = passByAccuracy(correct, ROUNDS, difficulty);
        if (passed) soundComplete(); else soundFail();
        recordFocusScore(pct);
        // completeDailyGame internally calls earnReward - don't double-award.
        if (passed) doUnlock(); // pass → unlock apps (no-op in practice)
        setResultMsg(pickResultMessage(passed));
        // Attention is the focus accuracy %.
        recordCognitiveScore('attention', pct);
        // Lifetime tile-stat counter - drives "X played" on the games tab.
        recordGame('focus', passed, pct);
        // Benchmark step: record raw attention score, advance to the next test.
        if (isBenchmark) { setBenchmarkScore('attention', pct); advanceBenchmark(bmIndex); return prev; }
        track(Events.GameCompleted, { game: 'focus', score_pct: pct, passed, credits: passed ? credits : 0 });
      }
      return prev;
    });
  };

  const handleStart = () => {
    track(Events.GameStarted, { game: 'focus', rounds: ROUNDS, demo: isDemo });
    setGameState('playing');
    setRoundIdx(0);
    setResults([]);
    setTimeout(() => startRound(), 300);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const correct = results.filter((r) => r.correct).length;
  const pct = results.length > 0 ? Math.round((correct / ROUNDS) * 100) : 0;

  const continueAfterDemo = () => router.push('/onboarding/demo-block');
  const goHome = () => router.replace('/(tabs)');

  // ── INTRO ──
  if (gameState === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Focus" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<FocusFlashIll size={88} />}
          title="Focus Flash"
          blurb={`Tap the screen for every number except 3. Stay alert.`}
          rules={[`🔢 ${ROUNDS} numbers`, "🚫 Don't tap on 3", '⚡ Stay sharp']}
          startLabel="Start"
          onStart={handleStart}
          isDemo={isDemo}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (gameState === 'result') {
    const passed = isDemo ? true : passByAccuracy(correct, ROUNDS, difficulty);
    const resultHue = !isDemo && !passed ? '#EF4444' : HUE;
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Focus" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Target size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
          passed={passed}
          bigStat={pct}
          bigStatSuffix="%"
          subtitle={`${correct} of ${ROUNDS} correct`}
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
  const progress = `${Math.min(roundIdx + 1, ROUNDS)} / ${ROUNDS}`;
  const flashTransform = flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader
        title="Focus"
        hue={HUE}
        rightSlot={
          <Text style={{ color: colors.muted, fontFamily: FontFamily.medium, fontSize: 13 }}>
            {progress}
          </Text>
        }
      />
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl }}>
          <View style={{ flex: 1 }} />
          {currentDigit !== null && (
            <Animated.Text
              style={[
                styles.digit,
                { color: currentDigit === NO_GO_DIGIT ? '#EF4444' : colors.text,
                  transform: [{ scale: flashTransform }],
                  opacity: flashAnim,
                },
              ]}
            >
              {currentDigit}
            </Animated.Text>
          )}
          <View style={{ flex: 1 }} />
          <Text style={[styles.hint, { color: colors.muted }]}>Tap anywhere - except on 3</Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  digit: {
    fontSize: 200,
    fontFamily: FontFamily.medium,
    letterSpacing: -8,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginBottom: 30,
    letterSpacing: 0.2,
  },
});
