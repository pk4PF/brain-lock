import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { DIFFICULTY_CONFIG } from '../../src/constants/games';
import GameShell, { GAME_THEMES } from '../../src/components/GameShell';
import GameComplete from '../../src/components/GameComplete';
import { generateProblem, type Problem } from '../../src/utils/mathProblem';

const TOTAL_ROUNDS = 10;
const theme = GAME_THEMES.math;

export default function MathGame() {
  const { settings, addPoints, recordGame } = useStore();
  const difficulty = settings.difficulty;
  const timeLimit = DIFFICULTY_CONFIG[difficulty].timeLimit;
  const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;

  const [problem, setProblem] = useState<Problem>(generateProblem(difficulty));
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameOver, setGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const correctRef = useRef(correct);
  const scoreRef = useRef(score);
  const roundRef = useRef(round);
  correctRef.current = correct;
  scoreRef.current = score;
  roundRef.current = round;

  const flashAnim = useRef(new Animated.Value(0)).current;
  const problemScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(problemScale, { toValue: 0.9, duration: 0, useNativeDriver: true }),
      Animated.spring(problemScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
    ]).start();
  }, [round]);

  useEffect(() => {
    startTime.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [round]);

  const handleTimeout = useCallback(() => {
    clearInterval(timerRef.current);
    if (roundRef.current >= TOTAL_ROUNDS) {
      finishGame(correctRef.current, scoreRef.current);
    } else {
      setRound((r) => r + 1);
      setProblem(generateProblem(difficulty));
      setTimeLeft(timeLimit);
      setSelectedAnswer(null);
      setIsCorrectAnswer(null);
    }
  }, [difficulty, timeLimit]);

  const finishGame = (finalCorrect: number, finalScore: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    addPoints(finalScore);
    recordGame('math', finalCorrect >= TOTAL_ROUNDS * 0.6, timeTaken);
    setGameOver(true);
  };

  const handleAnswer = (answer: number) => {
    if (selectedAnswer !== null) return;
    clearInterval(timerRef.current);

    const isRight = answer === problem.answer;
    setSelectedAnswer(answer);
    setIsCorrectAnswer(isRight);

    if (isRight) {
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }

    let newScore = score;
    let newCorrect = correct;
    if (isRight) {
      const points = Math.round(10 * multiplier);
      newScore = score + points;
      newCorrect = correct + 1;
      setScore(newScore);
      setCorrect(newCorrect);
    }

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        finishGame(newCorrect, newScore);
      } else {
        setRound((r) => r + 1);
        setProblem(generateProblem(difficulty));
        setTimeLeft(timeLimit);
        setSelectedAnswer(null);
        setIsCorrectAnswer(null);
      }
    }, 600);
  };

  const resetGame = () => {
    setScore(0);
    setRound(1);
    setCorrect(0);
    setTimeLeft(timeLimit);
    setGameOver(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setProblem(generateProblem(difficulty));
  };

  if (gameOver) {
    return (
      <GameComplete
        score={score}
        correct={correct}
        total={TOTAL_ROUNDS}
        gameTitle="Math Blitz"
        onPlayAgain={resetGame}
        gameId="math"
      />
    );
  }

  return (
    <GameShell title="Math Blitz" color="#00F0FF" score={score} timeLeft={timeLeft} gameId="math">
      {/* Neon glow flash on correct */}
      <Animated.View style={[styles.glowOverlay, { opacity: flashAnim }]} pointerEvents="none" />

      <View style={styles.roundIndicator}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.roundDot,
              i < round - 1 && styles.roundDotDone,
              i === round - 1 && styles.roundDotCurrent,
            ]}
          />
        ))}
      </View>

      <Animated.View style={[styles.problemContainer, { transform: [{ scale: problemScale }] }]}>
        <View style={styles.problemCard}>
          <Text style={styles.problemText}>
            {problem.a} {problem.op} {problem.b}
          </Text>
          <View style={styles.equalsLine} />
          <Text style={styles.equalsText}>?</Text>
        </View>
      </Animated.View>

      <View style={styles.optionsGrid}>
        {problem.options.map((option, idx) => {
          let borderCol = theme.cardBorder;
          let bgColor = theme.cardBg;
          let textColor = theme.textPrimary;
          let glowColor = 'transparent';

          if (selectedAnswer !== null) {
            if (option === problem.answer) {
              borderCol = '#22C55E';
              bgColor = 'rgba(34,197,94,0.15)';
              textColor = '#22C55E';
              glowColor = 'rgba(34,197,94,0.3)';
            } else if (option === selectedAnswer && !isCorrectAnswer) {
              borderCol = '#EF4444';
              bgColor = 'rgba(239,68,68,0.15)';
              textColor = '#EF4444';
            }
          }

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.optionButton,
                { backgroundColor: bgColor, borderColor: borderCol, shadowColor: glowColor },
              ]}
              onPress={() => handleAnswer(option)}
              activeOpacity={0.7}
              disabled={selectedAnswer !== null}
            >
              <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,240,255,0.05)',
    borderRadius: 20,
  },
  roundIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  roundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  roundDotDone: {
    backgroundColor: '#00F0FF',
  },
  roundDotCurrent: {
    backgroundColor: '#00F0FF',
    width: 20,
    borderRadius: 4,
  },
  problemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  problemCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xxxxl,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(0,240,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.15)',
  },
  problemText: {
    fontSize: 52,
    fontWeight: FontWeight.heavy,
    color: '#FFFFFF',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,240,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  equalsLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(0,240,255,0.3)',
    marginVertical: Spacing.md,
    borderRadius: 1,
  },
  equalsText: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    color: 'rgba(0,240,255,0.5)',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  optionButton: {
    width: '44%',
    paddingVertical: 18,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  optionText: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
  },
});
