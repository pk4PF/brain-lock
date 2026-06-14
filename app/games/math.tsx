import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Calculator } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { generateProblem, type Problem } from '../../src/utils/mathProblem';
import { soundTap, soundCorrect, soundWrong, soundRound } from '../../src/utils/sounds';
import { track, Events } from '../../src/services/analytics';
import { QuickMathIll } from '../../src/components/games/GameIllustrations';
import { advanceBenchmark } from '../../src/utils/benchmark';
import { router, useLocalSearchParams } from 'expo-router';

const HUE = GameAccents.math.hue;
const TOTAL_ROUNDS = 12;

type Phase = 'intro' | 'playing' | 'result';

/**
 * Performance-based 2-5 cells. Single curve (difficulty + timer removed) -
 * accuracy alone determines the reward.
 *   100%  → 5
 *   80-99% → 4
 *   60-79% → 3
 *   below → 2
 */
function creditsForMath(correct: number, total: number): number {
  const pct = (correct / total) * 100;
  if (pct >= 100) return 5;
  if (pct >= 80) return 4;
  if (pct >= 60) return 3;
  return 2;
}

export default function MathGame() {
  const { colors } = useThemeColors();
  const { addPoints, recordGame, recordCognitiveScore, setBenchmarkScore } = useStore();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();
  const params = useLocalSearchParams<{ benchmark?: string; bm?: string }>();
  const isBenchmark = params.benchmark === '1';
  const bmIndex = Number(params.bm ?? 0);
  // Benchmark runs a short 3-round test; normal play is the full set.
  const ROUNDS = isBenchmark ? 3 : TOTAL_ROUNDS;

  const [phase, setPhase] = useState<Phase>('intro');

  const [problem, setProblem] = useState<Problem>(generateProblem(1));
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  const startTime = useRef(Date.now());
  const problemScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(problemScale, { toValue: 0.92, duration: 0, useNativeDriver: true }),
      Animated.spring(problemScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
    ]).start();
  }, [round]);

  const finishGame = (finalCorrect: number, finalScore: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    addPoints(finalScore);
    const credits = creditsForMath(finalCorrect, ROUNDS);
    // Math is binary: one wrong answer fails the round. This overrides the
    // shared ACCURACY_PASS bands (60/80/100) because the spec is now
    // perfect-or-bust at every difficulty - if you can't do mental
    // arithmetic without errors, you don't get to unlock anything.
    const passed = finalCorrect === ROUNDS;
    recordGame('math', passed, timeTaken);
    if (passed) doUnlock(); // pass → unlock apps (no-op in practice)
    setResultMsg(pickResultMessage(passed));
    // Problem solving = math accuracy %.
    const accuracy = (finalCorrect / ROUNDS) * 100;
    recordCognitiveScore('problemSolving', accuracy);
    // Benchmark step (final test): record raw score, advance to the reveal.
    if (isBenchmark) { setBenchmarkScore('problemSolving', accuracy); advanceBenchmark(bmIndex); return; }
    track(Events.GameCompleted, {
      game: 'math',
      score: finalScore,
      correct: finalCorrect,
      total: ROUNDS,
      passed,
      credits_earned: passed ? credits : 0,
      time_taken_seconds: Math.round(timeTaken),
    });
    setPhase('result');
  };

  const handleAnswer = (answer: number) => {
    if (selectedAnswer !== null) return;
    soundTap();
    const isRight = answer === problem.answer;
    setSelectedAnswer(answer);
    setIsCorrectAnswer(isRight);
    if (isRight) soundCorrect();
    else soundWrong();
    let newScore = score;
    let newCorrect = correct;
    if (isRight) {
      newScore = score + 10;
      newCorrect = correct + 1;
      setScore(newScore);
      setCorrect(newCorrect);
    }
    setTimeout(() => {
      if (round >= ROUNDS) {
        finishGame(newCorrect, newScore);
      } else {
        soundRound();
        const nextR = round + 1;
        setRound(nextR);
        setProblem(generateProblem(nextR));
        setSelectedAnswer(null);
        setIsCorrectAnswer(null);
      }
    }, 600);
  };

  const handleStart = () => {
    setProblem(generateProblem(1));
    setRound(1);
    setScore(0);
    setCorrect(0);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    startTime.current = Date.now();
    track(Events.GameStarted, { game: 'math' });
    setPhase('playing');
  };

  const playAgain = () => handleStart();

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Math" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<QuickMathIll size={88} />}
          title="Quick Math"
          blurb="Ten problems. No clock - take your time. Each round gets a touch harder."
          rules={[`🔢 ${ROUNDS} rounds`, '🚫 No timer', '📈 Builds gradually']}
          startLabel="Start"
          onStart={handleStart}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const credits = creditsForMath(correct, ROUNDS);
    const passed = correct === ROUNDS;
    const resultHue = passed ? HUE : '#EF4444';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Math" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Calculator size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
          passed={passed}
          bigStat={`${correct}/${ROUNDS}`}
          subtitle={`${score} points`}
          unlockMinutes={isUnlock && passed ? unlockMinutes : undefined}
          primaryLabel={passed ? 'Play again' : 'Try again'}
          onPrimary={playAgain}
          secondaryLabel="Back to home"
          onSecondary={() => router.replace('/(tabs)')}
        />
      </View>
    );
  }

  // ── PLAYING ──
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader
        title="Math"
        hue={HUE}
        rightSlot={
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.scoreVal, { color: HUE }]}>{score}</Text>
            <Text style={[styles.scoreLbl, { color: colors.muted }]}>{round}/{ROUNDS}</Text>
          </View>
        }
      />

      {/* Problem */}
      <View style={styles.problemArea}>
        <Animated.View style={[styles.problemCard, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale: problemScale }] }]}>
          <Text style={[styles.problemText, { color: colors.text }]}>
            {problem.a} {problem.op} {problem.b}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.equalsQ, { color: HUE }]}>?</Text>
        </Animated.View>
      </View>

      {/* Answer grid */}
      <View style={styles.grid}>
        {problem.options.map((option, idx) => {
          let bg = colors.card;
          let border = colors.border;
          let textCol = colors.text;

          if (selectedAnswer !== null) {
            if (option === problem.answer) {
              bg = `${HUE}14`;
              border = HUE;
              textCol = HUE;
            } else if (option === selectedAnswer && !isCorrectAnswer) {
              bg = 'rgba(239,68,68,0.10)';
              border = '#EF4444';
              textCol = '#EF4444';
            }
          }

          return (
            <TouchableOpacity
              key={idx}
              style={[styles.optionTouch, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleAnswer(option)}
              activeOpacity={0.78}
              disabled={selectedAnswer !== null}
            >
              <Text style={[styles.optionText, { color: textCol }]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scoreVal: { fontSize: 18, fontFamily: FontFamily.semibold, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  scoreLbl: { fontSize: 11, fontFamily: FontFamily.medium, letterSpacing: 0.4 },

  problemArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  problemCard: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 48,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 240,
  },
  problemText: {
    fontSize: 64,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.5,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    width: 60,
    height: 1,
    marginVertical: 14,
  },
  equalsQ: {
    fontSize: 36,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.4,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  optionTouch: {
    width: '46%',
    paddingVertical: 22,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  optionText: {
    fontSize: 28,
    fontFamily: FontFamily.semibold,
    fontVariant: ['tabular-nums'],
  },
});
