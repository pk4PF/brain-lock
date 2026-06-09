import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { Lightbulb } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { NumberSequenceIll } from '../../src/components/games/GameIllustrations';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { passByAccuracy } from '../../src/constants/gameDifficulty';

const HUE = GameAccents['number-seq'].hue;
const TOTAL_ROUNDS = 10;

type Phase = 'intro' | 'playing' | 'result';

interface Sequence {
  visible: number[];
  answer: number;
  options: number[];
}

/**
 * Generate a random sequence puzzle. Picks one of:
 *   arithmetic (a, a+d, a+2d, ...)
 *   geometric  (a, a*r, a*r^2, ...)
 *   squares    (1, 4, 9, 16, 25, ...)
 *   doubling   (1, 2, 4, 8, 16, ...)  - special case of geometric
 *   triangular (1, 3, 6, 10, 15, ...)
 *
 * Returns a sequence of 4 visible numbers, the answer, and 4 multiple-choice
 * options (including the answer). Distractors are deliberately near the right
 * answer so guessing doesn't work.
 */
function generateSequence(): Sequence {
  const kind = Math.floor(Math.random() * 5);
  let visible: number[];
  let answer: number;

  if (kind === 0) {
    // arithmetic - common difference 1-7
    const start = Math.floor(Math.random() * 8) + 1;
    const d = Math.floor(Math.random() * 7) + 1;
    visible = [start, start + d, start + 2 * d, start + 3 * d];
    answer = start + 4 * d;
  } else if (kind === 1) {
    // geometric - ratio 2 or 3
    const r = Math.random() < 0.5 ? 2 : 3;
    const start = Math.floor(Math.random() * 4) + 1;
    visible = [start, start * r, start * r * r, start * r * r * r];
    answer = visible[3] * r;
  } else if (kind === 2) {
    // perfect squares offset
    const offset = Math.floor(Math.random() * 4);
    visible = [
      (offset + 1) ** 2,
      (offset + 2) ** 2,
      (offset + 3) ** 2,
      (offset + 4) ** 2,
    ];
    answer = (offset + 5) ** 2;
  } else if (kind === 3) {
    // doubling
    const start = Math.floor(Math.random() * 5) + 1;
    visible = [start, start * 2, start * 4, start * 8];
    answer = start * 16;
  } else {
    // triangular numbers (cumulative integers)
    const offset = Math.floor(Math.random() * 4);
    const tri = (n: number) => (n * (n + 1)) / 2;
    visible = [tri(offset + 1), tri(offset + 2), tri(offset + 3), tri(offset + 4)];
    answer = tri(offset + 5);
  }

  // Distractors near the answer so guessing doesn't work.
  const distractorPool = new Set<number>();
  while (distractorPool.size < 3) {
    const drift = (Math.floor(Math.random() * 7) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const candidate = answer + drift;
    if (candidate !== answer && candidate > 0) distractorPool.add(candidate);
  }
  const options = [answer, ...distractorPool];
  // Fisher-Yates shuffle.
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { visible, answer, options };
}

function creditsForScore(pct: number): number {
  if (pct >= 90) return 5;
  if (pct >= 70) return 4;
  if (pct >= 50) return 3;
  return 2;
}

export default function NumberSeqScreen() {
  const { colors } = useThemeColors();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();
  const { completeDailyGame, recordGame, recordCognitiveScore, canEarnToday, setShowPaywall } = useStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [seq, setSeq] = useState<Sequence>(() => generateSequence());
  const [picked, setPicked] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  const startTime = useRef(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }).start();
  }, [round, phase]);

  const startGame = () => {
    if (!canEarnToday()) { setShowPaywall(true); return; }
    track(Events.GameStarted, { game: 'number-seq' });
    setRound(0);
    setCorrect(0);
    setPicked(null);
    setSeq(generateSequence());
    startTime.current = Date.now();
    setPhase('playing');
  };

  const handlePick = (n: number) => {
    if (picked !== null) return;
    hapticLight();
    setPicked(n);
    const isRight = n === seq.answer;
    setShowFeedback(isRight ? 'correct' : 'wrong');
    if (isRight) setCorrect((c) => c + 1);

    setTimeout(() => {
      setPicked(null);
      setShowFeedback(null);
      if (round + 1 >= TOTAL_ROUNDS) {
        finishGame(isRight ? correct + 1 : correct);
      } else {
        setRound((r) => r + 1);
        setSeq(generateSequence());
      }
    }, 700);
  };

  const finishGame = (finalCorrect: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    const pct = Math.round((finalCorrect / TOTAL_ROUNDS) * 100);
    const credits = creditsForScore(pct);
    const passed = passByAccuracy(finalCorrect, TOTAL_ROUNDS, difficulty);

    recordGame('number-seq', passed, timeTaken);
    if (passed) doUnlock(); // pass → unlock apps (no-op in practice)
    setResultMsg(pickResultMessage(passed));
    recordCognitiveScore('problemSolving', pct);
    setEarnedCredits(credits);
    track(Events.GameCompleted, { game: 'number-seq', correct: finalCorrect, total: TOTAL_ROUNDS, passed, credits: passed ? credits : 0 });
    setPhase('result');
  };

  const goHome = () => router.replace('/(tabs)');

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Number Sequence" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<NumberSequenceIll size={88} />}
          title="Number Sequence"
          blurb="Spot the pattern. Pick the next number."
          rules={['🔢 Pattern recognition', `🔁 ${TOTAL_ROUNDS} rounds`, '☑️ Multiple choice']}
          startLabel="Start"
          onStart={startGame}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const pct = Math.round((correct / TOTAL_ROUNDS) * 100);
    const passed = passByAccuracy(correct, TOTAL_ROUNDS, difficulty);
    const resultHue = passed ? HUE : '#EF4444';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Number Sequence" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Lightbulb size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
          title={resultMsg.title}
          message={resultMsg.line}
          passed={passed}
          bigStat={pct}
          bigStatSuffix="%"
          subtitle={`${correct} of ${TOTAL_ROUNDS} correct`}
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
        title="Number Sequence"
        hue={HUE}
        rightSlot={
          <Text style={{ color: colors.muted, fontFamily: FontFamily.medium, fontSize: 13 }}>
            {round + 1} / {TOTAL_ROUNDS}
          </Text>
        }
      />
      <Animated.View style={{ flex: 1, opacity: fadeAnim, paddingHorizontal: Spacing.xl }}>
        <Text style={[styles.eyebrow, { color: colors.muted }]}>WHAT COMES NEXT?</Text>

        <View style={styles.sequenceRow}>
          {seq.visible.map((n, i) => (
            <View key={i} style={[styles.numberCell, { backgroundColor: colors.card, borderColor: `${HUE}22` }]}>
              <Text style={[styles.numberText, { color: colors.text }]}>{n}</Text>
            </View>
          ))}
          <View style={[styles.numberCell, { backgroundColor: `${HUE}15`, borderColor: HUE, borderWidth: 2 }]}>
            <Text style={[styles.numberText, { color: HUE }]}>?</Text>
          </View>
        </View>

        <View style={styles.optionsGrid}>
          {seq.options.map((opt) => {
            const selected = picked === opt;
            const isRightShown = showFeedback && opt === seq.answer;
            const isWrongShown = showFeedback === 'wrong' && selected;
            const bg = isRightShown ? '#22C55E22' : isWrongShown ? '#EF444422' : colors.card;
            const border = isRightShown ? '#22C55E' : isWrongShown ? '#EF4444' : colors.border;
            return (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.85}
                disabled={picked !== null}
                onPress={() => handlePick(opt)}
                style={[styles.optionBtn, { backgroundColor: bg, borderColor: border }]}
              >
                <Text style={[styles.optionText, { color: colors.text }]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 18,
  },
  sequenceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 36,
  },
  numberCell: {
    width: 60,
    height: 70,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 26,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionBtn: {
    width: '48%',
    height: 72,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 26,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
});
