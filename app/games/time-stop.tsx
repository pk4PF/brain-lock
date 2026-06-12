import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Timer } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium, hapticSuccess } from '../../src/utils/haptics';
import { soundTap, soundCorrect, soundWrong, soundComplete, soundFail } from '../../src/utils/sounds';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { TimeRecallIll } from '../../src/components/games/GameIllustrations';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { TIMESTOP_TOLERANCE_MS } from '../../src/constants/gameDifficulty';

const HUE = GameAccents['time-stop'].hue;
const TARGET_MS = 5000;
const TOTAL_SHOTS = 3;
const VISIBLE_UNTIL_MS = 1000; // timer hides after 1.00s — count the rest in your head
const WAY_OFF_MS = 300;

type Phase = 'intro' | 'playing' | 'result';
// Per-shot state machine: running (clock live, tap to stop) → between (show the error).
type ShotState = 'running' | 'between';

function creditsForError(bestErr: number): number {
  if (bestErr <= 35) return 5;
  if (bestErr <= 80) return 4;
  if (bestErr <= 150) return 3;
  return 2;
}

/**
 * Perfect Timing - stop the clock at exactly 5.00s. The readout goes dark
 * after one second, so the last four seconds live entirely in your head.
 * 3 shots, smallest absolute error counts.
 *
 * Timing notes - this is a measurement tool, so the clock has to be honest:
 *  - `performance.now()` ref stamps the true start; the stopped time is
 *    computed from `performance.now() - startRef`, never from accumulated
 *    interval state (intervals drift).
 *  - The visible readout is driven by a ~50ms interval purely for display.
 *  - `Pressable.onPressIn` (touch-down), NOT `onPress` (finger release).
 */
export default function TimeStopScreen() {
  const { colors } = useThemeColors();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();
  const { recordGame, recordCognitiveScore, canEarnToday, setShowPaywall } = useStore();

  const toleranceMs = TIMESTOP_TOLERANCE_MS[difficulty];

  const [phase, setPhase] = useState<Phase>('intro');
  const [shotState, setShotState] = useState<ShotState>('running');
  const [shotIdx, setShotIdx] = useState(0);
  // Absolute error (ms) per shot.
  const [errors, setErrors] = useState<number[]>([]);
  const [displayMs, setDisplayMs] = useState(0);
  const [lastLabel, setLastLabel] = useState(''); // "5.13s — +130ms off"
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  const startRef = useRef(0);
  const gameStart = useRef(0);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const betweenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (tickTimer.current) { clearInterval(tickTimer.current); tickTimer.current = null; }
    if (betweenTimer.current) { clearTimeout(betweenTimer.current); betweenTimer.current = null; }
  };

  useEffect(() => () => clearTimers(), []);

  const armShot = () => {
    clearTimers();
    setDisplayMs(0);
    setShotState('running');
    startRef.current = performance.now();
    // Display-only tick; the stopped time never comes from this.
    tickTimer.current = setInterval(() => {
      setDisplayMs(performance.now() - startRef.current);
    }, 50);
  };

  const startGame = () => {
    track(Events.GameStarted, { game: 'time-stop' });
    setErrors([]);
    setShotIdx(0);
    setLastLabel('');
    gameStart.current = Date.now();
    setPhase('playing');
    armShot();
  };

  const handleStop = () => {
    if (phase !== 'playing' || shotState !== 'running') return;
    const stoppedMs = performance.now() - startRef.current;
    if (tickTimer.current) { clearInterval(tickTimer.current); tickTimer.current = null; }

    const signed = Math.round(stoppedMs - TARGET_MS);
    const absErr = Math.abs(signed);
    soundTap();
    if (absErr <= toleranceMs) {
      hapticSuccess();
      soundCorrect();
    } else if (absErr > WAY_OFF_MS) {
      hapticMedium();
      soundWrong();
    } else {
      hapticLight();
    }

    const newErrors = [...errors, absErr];
    setErrors(newErrors);
    setLastLabel(`${(stoppedMs / 1000).toFixed(2)}s — ${signed >= 0 ? '+' : '−'}${absErr}ms off`);
    setShotState('between');

    if (newErrors.length >= TOTAL_SHOTS) {
      betweenTimer.current = setTimeout(() => finishGame(newErrors), 1200);
    } else {
      setShotIdx(newErrors.length);
      betweenTimer.current = setTimeout(armShot, 1200);
    }
  };

  const finishGame = (allErrors: number[]) => {
    clearTimers();
    const totalElapsed = (Date.now() - gameStart.current) / 1000;
    const best = Math.min(...allErrors);
    const passed = best <= toleranceMs;
    if (passed) soundComplete(); else soundFail();
    recordGame('time-stop', passed, totalElapsed);
    if (passed) doUnlock();
    setResultMsg(pickResultMessage(passed));
    // Focus/attention map: 0ms = 100, 500ms = 0. (Store has no 'focus'
    // area — 'attention' is the matching bucket.)
    const focusScore = Math.max(0, Math.min(100, 100 - best / 5));
    recordCognitiveScore('attention', focusScore);
    track(Events.GameCompleted, {
      game: 'time-stop', best_error_ms: best, tolerance_ms: toleranceMs, passed,
      credits: passed ? creditsForError(best) : 0,
    });
    setPhase('result');
  };

  const goHome = () => router.replace('/(tabs)');

  const bestErr = errors.length > 0 ? Math.min(...errors) : null;

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Perfect Timing" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<TimeRecallIll size={88} />}
          title="Perfect Timing"
          blurb={`Stop the clock at exactly 5.00s. The timer disappears after 1 second — count it out in your head. Best of 3 counts. Land within ${toleranceMs}ms to pass.`}
          rules={['⏱️ Stop at 5.00s', `🎯 Within ${toleranceMs}ms`, `🔁 Best of ${TOTAL_SHOTS}`]}
          startLabel="Start"
          onStart={startGame}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const passed = bestErr !== null && bestErr <= toleranceMs;
    const resultHue = passed ? HUE : '#EF4444';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Perfect Timing" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Timer size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
          passed={passed}
          bigStat={bestErr ?? 0}
          bigStatSuffix="ms"
          subtitle="Off target — best of 3"
          unlockMinutes={isUnlock && passed ? unlockMinutes : undefined}
          primaryLabel={passed ? 'Play again' : 'Try again'}
          onPrimary={startGame}
          secondaryLabel="Back to home"
          onSecondary={goHome}
        />
      </View>
    );
  }

  // ── PLAYING ── the whole screen is the stop button.
  const timerHidden = shotState === 'running' && displayMs >= VISIBLE_UNTIL_MS;

  return (
    <Pressable style={{ flex: 1, backgroundColor: colors.background }} onPressIn={handleStop}>
      <GameHeader
        title="Perfect Timing"
        hue={HUE}
        rightSlot={
          <Text style={{ color: colors.muted, fontFamily: FontFamily.medium, fontSize: 13 }}>
            Shot {Math.min(shotIdx + 1, TOTAL_SHOTS)} / {TOTAL_SHOTS}
          </Text>
        }
      />
      <View style={styles.stage}>
        {shotState === 'running' ? (
          <>
            <Text style={[styles.clock, { color: timerHidden ? colors.muted : colors.text }]}>
              {timerHidden ? '…' : `${(displayMs / 1000).toFixed(2)}s`}
            </Text>
            <Text style={[styles.hint, { color: colors.muted }]}>
              {timerHidden ? 'Keep counting — tap at 5.00s' : 'Timer hides at 1.00s'}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.shotResult, { color: colors.text }]}>{lastLabel}</Text>
            {errors.length < TOTAL_SHOTS && (
              <Text style={[styles.hint, { color: colors.muted }]}>Get ready…</Text>
            )}
          </>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.muted }]}>
          {Array.from({ length: TOTAL_SHOTS }, (_, i) =>
            errors[i] === undefined ? '—' : `${errors[i]}ms`
          ).join('   ')}
        </Text>
        <Text style={[styles.footerText, { color: colors.muted }]}>
          Target: within {toleranceMs}ms of 5.00s
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  clock: {
    fontSize: 72,
    fontFamily: FontFamily.semibold,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  shotResult: {
    fontSize: 32,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    marginTop: 12,
  },
  footer: {
    alignItems: 'center',
    gap: 6,
    paddingBottom: 48,
  },
  footerText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
});
