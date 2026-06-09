import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SoccerBall } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { CupShuffleIll } from '../../src/components/games/GameIllustrations';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { CUP_TARGET } from '../../src/constants/gameDifficulty';

const HUE = GameAccents['cup-shuffle'].hue;
const BALL = '#EAB308';

const { width: SW } = Dimensions.get('window');
const PLAY_PAD = 28;
const PLAY_W = SW - PLAY_PAD * 2;
const CUPW = 58;
const CUPH = 76;
const LIFT = 56;
const BALLSIZE = 32;
const MAX_CUPS = 5;
const MAX_ROUNDS = 5; // short + brutal: 5 clean rounds = win (built for quick clips)

type Phase = 'intro' | 'reveal' | 'shuffle' | 'pick' | 'result';

function slotX(slot: number, n: number): number {
  const sw = PLAY_W / n;
  return slot * sw + (sw - CUPW) / 2;
}

function cupCountFor(_cleared: number): number {
  // 5 cups every round - hard but trackable.
  return 5;
}

function creditsForCups(cleared: number): number {
  // Only a full 5-round clear passes, and a full clear earns the max.
  if (cleared >= 5) return 5;
  if (cleared >= 3) return 4;
  return 2;
}

/**
 * Follow the Ball - the shell game. A ball hides under a cup, the cups shuffle
 * faster and in greater number every round, then you pick. The shuffle IS the
 * content: viewers play along and gasp at the reveal. Miss = you stay locked.
 */
export default function CupShuffleScreen() {
  const { colors } = useThemeColors();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();
  const target = CUP_TARGET[difficulty]; // rounds to survive = win
  const { completeDailyGame, recordGame, recordCognitiveScore, canEarnToday, setShowPaywall } = useStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [cupCount, setCupCount] = useState(3);
  const [cleared, setCleared] = useState(0);
  const [ballCupId, setBallCupId] = useState(0);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  // Per-cup translate values (created once). slotOfCup tracks logical position.
  const tx = useRef(Array.from({ length: MAX_CUPS }, () => new Animated.Value(0))).current;
  const ty = useRef(Array.from({ length: MAX_CUPS }, () => new Animated.Value(0))).current;
  const slotOfCup = useRef<number[]>([]);
  // The ball is chosen ONCE per game and stays under the same cup the whole
  // time - it only ever moves when cups physically swap. Never re-randomised.
  const ballRef = useRef(0);
  const startTime = useRef(0);
  const aliveRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { aliveRef.current = false; if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const wait = (ms: number) => new Promise<void>((res) => { timerRef.current = setTimeout(res, ms); });
  const cupInSlot = (slot: number) => slotOfCup.current.findIndex((s) => s === slot);

  const lift = (cupId: number, up: boolean) => new Promise<void>((res) => {
    Animated.timing(ty[cupId], { toValue: up ? -LIFT : 0, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => res());
  });

  const swap = (slotA: number, slotB: number, dur: number) => new Promise<void>((res) => {
    const cupA = cupInSlot(slotA);
    const cupB = cupInSlot(slotB);
    const xA = slotX(slotA, slotOfCup.current.length);
    const xB = slotX(slotB, slotOfCup.current.length);
    const arc = (cupId: number, toX: number, dir: number) => Animated.parallel([
      Animated.timing(tx[cupId], { toValue: toX, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(ty[cupId], { toValue: dir * -18, duration: dur / 2, useNativeDriver: true }),
        Animated.timing(ty[cupId], { toValue: 0, duration: dur / 2, useNativeDriver: true }),
      ]),
    ]);
    Animated.parallel([arc(cupA, xB, 1), arc(cupB, xA, -1)]).start(() => {
      slotOfCup.current[cupA] = slotB;
      slotOfCup.current[cupB] = slotA;
      res();
    });
  });

  const runRound = async (clearedSoFar: number) => {
    const n = cupCountFor(clearedSoFar);

    // First round only: lay the cups out and reveal the ball ONCE. Every
    // round after that just keeps shuffling the same ball from wherever the
    // cups currently are - no reset, no re-reveal. One continuous game.
    if (clearedSoFar === 0) {
      slotOfCup.current = Array.from({ length: n }, (_, i) => i);
      for (let id = 0; id < n; id++) {
        tx[id].setValue(slotX(id, n));
        ty[id].setValue(0);
      }
      setCupCount(n);
      setBallCupId(ballRef.current);

      setPhase('reveal');
      await wait(350);
      if (!aliveRef.current) return;
      await lift(ballRef.current, true);
      await wait(600);
      if (!aliveRef.current) return;
      await lift(ballRef.current, false);
      await wait(200);
      if (!aliveRef.current) return;
    }

    // Shuffle - more swaps + faster as rounds climb.
    setPhase('shuffle');
    const swaps = 8 + clearedSoFar * 3;
    const dur = Math.max(120, 300 - clearedSoFar * 30);
    for (let i = 0; i < swaps; i++) {
      if (!aliveRef.current) return;
      let a = Math.floor(Math.random() * n);
      let b = Math.floor(Math.random() * n);
      while (b === a) b = Math.floor(Math.random() * n);
      await swap(a, b, dur);
    }
    if (!aliveRef.current) return;
    setPhase('pick');
  };

  const startGame = () => {
    if (!canEarnToday()) { setShowPaywall(true); return; }
    track(Events.GameStarted, { game: 'cup-shuffle' });
    setCleared(0);
    ballRef.current = Math.floor(Math.random() * cupCountFor(0)); // pick the ball once
    startTime.current = Date.now();
    runRound(0);
  };

  const handlePick = async (cupId: number) => {
    if (phase !== 'pick') return;
    setPhase('reveal'); // lock input
    hapticLight();
    await lift(cupId, true);
    const correct = cupId === ballCupId;
    if (correct) {
      const next = cleared + 1;
      setCleared(next);
      await wait(550);
      if (!aliveRef.current) return;
      await lift(cupId, false);
      if (next >= target) { finishGame(next); return; } // hit the difficulty target = win
      runRound(next);
    } else {
      hapticMedium();
      if (ballCupId !== cupId) await lift(ballCupId, true); // show where it was
      await wait(700);
      finishGame(cleared);
    }
  };

  const finishGame = (finalCleared: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    const credits = creditsForCups(finalCleared);
    const passed = finalCleared >= target;
    recordGame('cup-shuffle', passed, timeTaken);
    if (passed) doUnlock(); // pass → unlock apps (no-op in practice)
    setResultMsg(pickResultMessage(passed));
    recordCognitiveScore('attention', Math.min(100, finalCleared * 12));
    setEarnedCredits(credits);
    track(Events.GameCompleted, { game: 'cup-shuffle', rounds: finalCleared, passed, credits: passed ? credits : 0 });
    setPhase('result');
  };

  const goHome = () => router.replace('/(tabs)');

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Follow the Ball" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<CupShuffleIll size={88} />}
          title="Follow the Ball"
          blurb="Watch which cup hides the ball, then keep your eye on it as they shuffle. Each round gets faster."
          rules={['👁️ Visual tracking', '🥤 Shuffles speed up', '❌ One wrong cup ends it']}
          startLabel="Start"
          onStart={startGame}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const passed = cleared >= target;
    const resultHue = passed ? HUE : '#EF4444';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Follow the Ball" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<SoccerBall size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
          title={resultMsg.title}
          message={resultMsg.line}
          passed={passed}
          bigStat={cleared}
          subtitle="Rounds tracked"
          unlockMinutes={isUnlock && passed ? unlockMinutes : undefined}
          primaryLabel={passed ? 'Play again' : 'Try again'}
          onPrimary={startGame}
          secondaryLabel="Back to home"
          onSecondary={goHome}
        />
      </View>
    );
  }

  // ── PLAYING (reveal / shuffle / pick) ──
  const hint =
    phase === 'reveal' ? 'Watch the ball…' :
    phase === 'shuffle' ? 'Keep your eye on it' :
    'Tap the cup with the ball';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader
        title="Follow the Ball"
        hue={HUE}
        rightSlot={
          <Text style={{ color: colors.muted, fontFamily: FontFamily.medium, fontSize: 13 }}>
            Round {cleared + 1}
          </Text>
        }
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={[styles.stage, { width: PLAY_W }]}>
          {/* Ball - sits at the ball cup's x, behind the cups. Revealed when a
              cup lifts above it. */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ball,
              {
                backgroundColor: BALL,
                transform: [{ translateX: Animated.add(tx[ballCupId], (CUPW - BALLSIZE) / 2) }],
              },
            ]}
          />
          {Array.from({ length: cupCount }).map((_, id) => (
            <Animated.View
              key={id}
              style={[
                styles.cupWrap,
                { transform: [{ translateX: tx[id] }, { translateY: ty[id] }] },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={phase !== 'pick'}
                onPress={() => handlePick(id)}
                style={[styles.cup, { backgroundColor: HUE }]}
              >
                <View style={styles.cupRim} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        <Text style={[styles.hint, { color: colors.muted }]}>{hint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: CUPH + LIFT,
    alignSelf: 'center',
  },
  cupWrap: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: CUPW,
    height: CUPH,
  },
  cup: {
    width: CUPW,
    height: CUPH,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    alignItems: 'center',
    overflow: 'hidden',
  },
  cupRim: {
    width: CUPW,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  ball: {
    position: 'absolute',
    left: 0,
    bottom: 8,
    width: BALLSIZE,
    height: BALLSIZE,
    borderRadius: BALLSIZE / 2,
  },
  hint: {
    marginTop: 48,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.3,
  },
});
