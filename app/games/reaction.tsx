import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Lightning } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { soundTap, soundWrong, soundComplete, soundFail } from '../../src/utils/sounds';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { ReactionTestIll } from '../../src/components/games/GameIllustrations';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { REACTION_MS } from '../../src/constants/gameDifficulty';

const HUE = GameAccents.reaction.hue;
const WAIT_RED = '#C62828';
const GO_GREEN = '#2E7D32';
const TOTAL_SHOTS = 3;

type Phase = 'intro' | 'playing' | 'result';
// Per-shot state machine: arming (red) → go (green) → between (show the ms).
type ShotState = 'arming' | 'go' | 'between';

function creditsForBest(bestMs: number): number {
  if (bestMs <= 240) return 5;
  if (bestMs <= 280) return 4;
  if (bestMs <= 340) return 3;
  return 2;
}

/**
 * Reaction Test: screen turns red ("wait…"), then green after a random
 * delay — tap the instant it flips. 3 shots, best one counts. A false
 * start (tapping on red) burns the shot.
 *
 * Latency notes — this is a measurement tool, so the clock has to be
 * honest (the old tap games read ~50–150ms slow):
 *  - `Pressable.onPressIn` (touch-down), NOT `onPress` (finger release).
 *  - `performance.now()` for sub-ms monotonic timestamps.
 *  - The green timestamp is stamped inside `requestAnimationFrame` after
 *    the state flip, so it aligns with the frame that actually paints
 *    green rather than the JS tick that scheduled it.
 */
export default function ReactionScreen() {
  const { colors } = useThemeColors();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();
  const { recordGame, recordCognitiveScore, canEarnToday, setShowPaywall } = useStore();

  const targetMs = REACTION_MS[difficulty];

  const [phase, setPhase] = useState<Phase>('intro');
  const [shotState, setShotState] = useState<ShotState>('arming');
  const [shotIdx, setShotIdx] = useState(0);
  // ms per shot; null = false start (burned shot).
  const [shots, setShots] = useState<(number | null)[]>([]);
  const [lastLabel, setLastLabel] = useState(''); // "247ms" or "Too soon!"
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  const greenAt = useRef(0);
  const startTime = useRef(0);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const betweenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (armTimer.current) clearTimeout(armTimer.current);
    if (betweenTimer.current) clearTimeout(betweenTimer.current);
  }, []);

  const armShot = () => {
    setShotState('arming');
    // Random 1.5–3.5s wait so the flip can't be anticipated.
    const delay = 1500 + Math.random() * 2000;
    armTimer.current = setTimeout(() => {
      setShotState('go');
      // Stamp on the frame that paints green, not the JS tick before it.
      requestAnimationFrame(() => { greenAt.current = performance.now(); });
    }, delay);
  };

  const startGame = () => {
    track(Events.GameStarted, { game: 'reaction' });
    setShots([]);
    setShotIdx(0);
    setLastLabel('');
    startTime.current = Date.now();
    setPhase('playing');
    armShot();
  };

  const advance = (allShots: (number | null)[]) => {
    if (allShots.length >= TOTAL_SHOTS) {
      finishGame(allShots);
    } else {
      setShotIdx(allShots.length);
      betweenTimer.current = setTimeout(armShot, 1100);
    }
  };

  const handlePressIn = () => {
    if (phase !== 'playing') return;

    if (shotState === 'arming') {
      // False start — burn the shot.
      if (armTimer.current) clearTimeout(armTimer.current);
      hapticMedium();
      soundWrong();
      const newShots = [...shots, null];
      setShots(newShots);
      setLastLabel('Too soon!');
      setShotState('between');
      advance(newShots);
      return;
    }

    if (shotState === 'go') {
      const ms = Math.round(performance.now() - greenAt.current);
      hapticLight();
      soundTap();
      const newShots = [...shots, ms];
      setShots(newShots);
      setLastLabel(`${ms}ms`);
      setShotState('between');
      advance(newShots);
    }
  };

  const finishGame = (allShots: (number | null)[]) => {
    const totalElapsed = (Date.now() - startTime.current) / 1000;
    const valid = allShots.filter((s): s is number => s !== null);
    const best = valid.length > 0 ? Math.min(...valid) : null;
    const passed = best !== null && best <= targetMs;
    if (passed) soundComplete(); else soundFail();
    recordGame('reaction', passed, totalElapsed);
    if (passed) doUnlock();
    setResultMsg(pickResultMessage(passed));
    if (best !== null) {
      // Speed map: 180ms = 100, 480ms = 0.
      const speedScore = Math.max(0, Math.min(100, 100 - (best - 180) / 3));
      recordCognitiveScore('speed', speedScore);
    }
    track(Events.GameCompleted, {
      game: 'reaction', best_ms: best, target_ms: targetMs, passed,
      credits: passed && best !== null ? creditsForBest(best) : 0,
    });
    setPhase('result');
  };

  const goHome = () => router.replace('/(tabs)');

  const validShots = shots.filter((s): s is number => s !== null);
  const bestMs = validShots.length > 0 ? Math.min(...validShots) : null;

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Reaction Test" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<ReactionTestIll size={88} />}
          title="Reaction Test"
          blurb={`Wait for green, tap the instant it flips. ${TOTAL_SHOTS} shots — your best one counts. Beat ${targetMs}ms to pass. Tap on red and you burn the shot.`}
          rules={['🟥 Wait for green', `⚡ Beat ${targetMs}ms`, `🎯 Best of ${TOTAL_SHOTS}`]}
          startLabel="Start"
          onStart={startGame}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const passed = bestMs !== null && bestMs <= targetMs;
    const resultHue = passed ? HUE : '#EF4444';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Reaction Test" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Lightning size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
          message={bestMs === null ? 'Three false starts. Patience is part of speed.' : undefined}
          passed={passed}
          bigStat={bestMs ?? 0}
          bigStatSuffix="ms"
          subtitle={`Best of ${TOTAL_SHOTS} — target ${targetMs}ms`}
          unlockMinutes={isUnlock && passed ? unlockMinutes : undefined}
          primaryLabel={passed ? 'Play again' : 'Try again'}
          onPrimary={startGame}
          secondaryLabel="Back to home"
          onSecondary={goHome}
        />
      </View>
    );
  }

  // ── PLAYING ── full-screen stimulus; the whole screen is the button.
  const bg =
    shotState === 'go' ? GO_GREEN :
    shotState === 'arming' ? WAIT_RED :
    colors.background;

  return (
    <Pressable style={{ flex: 1, backgroundColor: bg }} onPressIn={handlePressIn}>
      <GameHeader
        title="Reaction Test"
        hue={shotState === 'between' ? HUE : '#FFFFFF'}
        rightSlot={
          <Text style={[styles.shotCounter, { color: shotState === 'between' ? colors.muted : 'rgba(255,255,255,0.85)' }]}>
            Shot {Math.min(shotIdx + 1, TOTAL_SHOTS)} / {TOTAL_SHOTS}
          </Text>
        }
      />
      <View style={styles.stage}>
        {shotState === 'arming' && (
          <>
            <Text style={styles.bigText}>Wait for green…</Text>
            <Text style={styles.subText}>Tap the moment it flips</Text>
          </>
        )}
        {shotState === 'go' && <Text style={styles.bigText}>TAP!</Text>}
        {shotState === 'between' && (
          <>
            <Text style={[styles.msText, { color: lastLabel === 'Too soon!' ? '#EF4444' : colors.text }]}>
              {lastLabel}
            </Text>
            {shots.length < TOTAL_SHOTS && (
              <Text style={[styles.subText, { color: colors.muted }]}>Get ready…</Text>
            )}
          </>
        )}
      </View>
      {/* Shots so far + target, pinned low so clips read clean. */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: shotState === 'between' ? colors.muted : 'rgba(255,255,255,0.8)' }]}>
          {Array.from({ length: TOTAL_SHOTS }, (_, i) =>
            shots[i] === undefined ? '—' : shots[i] === null ? '✕' : `${shots[i]}ms`
          ).join('   ')}
        </Text>
        <Text style={[styles.footerText, { color: shotState === 'between' ? colors.muted : 'rgba(255,255,255,0.8)' }]}>
          Target: under {targetMs}ms
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
  bigText: {
    fontSize: 36,
    fontFamily: FontFamily.semibold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 10,
  },
  msText: {
    fontSize: 56,
    fontFamily: FontFamily.semibold,
    letterSpacing: -1.5,
  },
  shotCounter: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
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
  },
});
