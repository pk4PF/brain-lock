import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import GameShell, { GAME_THEMES } from '../../src/components/GameShell';
import GameComplete from '../../src/components/GameComplete';
import { generateProblem, type Problem } from '../../src/utils/mathProblem';
import { soundTap, soundCorrect, soundWrong, soundRound } from '../../src/utils/sounds';

const TOTAL_ROUNDS = 10;
const T = GAME_THEMES.math;
const TIME_STAGES = [15, 15, 12, 12, 10, 10, 8, 8, 7, 6];
const MULT_STAGES = [1, 1, 1, 1.2, 1.2, 1.5, 1.5, 1.8, 2, 2];

export default function MathGame() {
  const { addPoints, recordGame, completeDailyGame } = useStore();

  const [problem, setProblem] = useState<Problem>(generateProblem(1));
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_STAGES[0]);
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
        if (t <= 1) { handleTimeout(); return 0; }
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
      const nextRound = roundRef.current + 1;
      setRound(nextRound);
      setProblem(generateProblem(nextRound));
      setTimeLeft(TIME_STAGES[Math.min(nextRound - 1, TIME_STAGES.length - 1)]);
      setSelectedAnswer(null);
      setIsCorrectAnswer(null);
    }
  }, []);

  const finishGame = (finalCorrect: number, finalScore: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    addPoints(finalScore);
    const won = finalCorrect >= TOTAL_ROUNDS * 0.6;
    recordGame('math', won, timeTaken);
    completeDailyGame();
    setGameOver(true);
  };

  const handleAnswer = (answer: number) => {
    if (selectedAnswer !== null) return;
    soundTap();
    clearInterval(timerRef.current);
    const isRight = answer === problem.answer;
    setSelectedAnswer(answer);
    setIsCorrectAnswer(isRight);
    if (isRight) {
      soundCorrect();
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
    if (!isRight) { soundWrong(); }
    let newScore = score;
    let newCorrect = correct;
    if (isRight) {
      const points = Math.round(10 * MULT_STAGES[Math.min(round - 1, MULT_STAGES.length - 1)]);
      newScore = score + points;
      newCorrect = correct + 1;
      setScore(newScore);
      setCorrect(newCorrect);
    }
    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) { finishGame(newCorrect, newScore); }
      else {
        soundRound();
        const nextR = round + 1;
        setRound(nextR);
        setProblem(generateProblem(nextR));
        setTimeLeft(TIME_STAGES[Math.min(nextR - 1, TIME_STAGES.length - 1)]);
        setSelectedAnswer(null);
        setIsCorrectAnswer(null);
      }
    }, 600);
  };

  const resetGame = () => {
    setScore(0); setRound(1); setCorrect(0); setTimeLeft(TIME_STAGES[0]);
    setGameOver(false); setSelectedAnswer(null); setIsCorrectAnswer(null);
    setProblem(generateProblem(1));
  };

  if (gameOver) {
    return <GameComplete score={score} correct={correct} total={TOTAL_ROUNDS} gameTitle="Math Blitz" onPlayAgain={resetGame} gameId="math" />;
  }

  return (
    <GameShell title="Math Blitz" color="#00F0FF" score={score} timeLeft={timeLeft} gameId="math" multiplier={MULT_STAGES[Math.min(round - 1, MULT_STAGES.length - 1)]}>
      <Animated.View style={[styles.glowOverlay, { opacity: flashAnim }]} pointerEvents="none" />

      {/* Progress pips */}
      <View style={styles.pips}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View key={i} style={[styles.pip, i < round - 1 && styles.pipDone, i === round - 1 && styles.pipCurrent]} />
        ))}
      </View>

      {/* Problem display */}
      <Animated.View style={[styles.problemWrap, { transform: [{ scale: problemScale }] }]}>
        <LinearGradient
          colors={['rgba(0,240,255,0.08)', 'rgba(0,240,255,0.02)']}
          style={styles.problemCard}
        >
          <Text style={styles.problemText}>{problem.a} {problem.op} {problem.b}</Text>
          <LinearGradient
            colors={['transparent', 'rgba(0,240,255,0.25)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.dividerLine}
          />
          <Text style={styles.equalsQ}>?</Text>
        </LinearGradient>
      </Animated.View>

      {/* Answer grid */}
      <View style={styles.grid}>
        {problem.options.map((option, idx) => {
          let borderCol = 'rgba(0,240,255,0.12)';
          let bgColors: [string, string] = ['rgba(0,240,255,0.05)', 'rgba(0,240,255,0.02)'];
          let textCol = '#E8F4FF';

          if (selectedAnswer !== null) {
            if (option === problem.answer) {
              borderCol = '#22C55E';
              bgColors = ['rgba(34,197,94,0.18)', 'rgba(34,197,94,0.06)'];
              textCol = '#22C55E';
            } else if (option === selectedAnswer && !isCorrectAnswer) {
              borderCol = '#EF4444';
              bgColors = ['rgba(239,68,68,0.18)', 'rgba(239,68,68,0.06)'];
              textCol = '#EF4444';
            }
          }

          return (
            <TouchableOpacity
              key={idx}
              style={styles.optionTouch}
              onPress={() => handleAnswer(option)}
              activeOpacity={0.7}
              disabled={selectedAnswer !== null}
            >
              <LinearGradient colors={bgColors} style={[styles.optionCard, { borderColor: borderCol }]}>
                <Text style={[styles.optionText, { color: textCol }]}>{option}</Text>
              </LinearGradient>
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
    backgroundColor: 'rgba(0,240,255,0.04)',
    borderRadius: 20,
  },
  pips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  pip: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(0,240,255,0.12)',
  },
  pipDone: { backgroundColor: '#00F0FF' },
  pipCurrent: { backgroundColor: '#00F0FF' },
  problemWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    maxHeight: 260,
  },
  problemCard: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.1)',
  },
  problemText: {
    fontSize: 52,
    fontFamily: FontFamily.heavy,
    color: '#E8F4FF',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,240,255,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  dividerLine: {
    width: 60,
    height: 2,
    borderRadius: 1,
    marginVertical: 14,
  },
  equalsQ: {
    fontSize: 36,
    fontFamily: FontFamily.bold,
    color: 'rgba(0,240,255,0.4)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingBottom: 12,
  },
  optionTouch: { width: '46%' },
  optionCard: {
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  optionText: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
  },
});
