import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { DIFFICULTY_CONFIG } from '../../src/constants/games';
import GameShell, { GAME_THEMES } from '../../src/components/GameShell';
import GameComplete from '../../src/components/GameComplete';

const theme = GAME_THEMES.pattern;

const SHAPES = ['●', '■', '▲', '◆', '★', '⬟'];
const AURORA_COLORS = ['#7B61FF', '#00D4AA', '#FF69B4', '#00B4D8', '#FFD93D', '#FF6B6B'];

interface PatternProblem {
  grid: number[];
  missingIndex: number;
  answer: number;
  options: number[];
}

function generatePattern(difficulty: 'easy' | 'medium' | 'hard'): PatternProblem {
  const gridSize = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 9;
  const numShapes = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;

  const patternBase: number[] = [];
  for (let i = 0; i < numShapes; i++) {
    patternBase.push(i % numShapes);
  }

  const grid: number[] = [];
  for (let i = 0; i < gridSize; i++) {
    grid.push(patternBase[i % patternBase.length]);
  }

  const missingIndex = Math.floor(Math.random() * gridSize);
  const answer = grid[missingIndex];

  const wrongOptions = new Set<number>();
  while (wrongOptions.size < 3) {
    const wrong = Math.floor(Math.random() * numShapes);
    if (wrong !== answer) wrongOptions.add(wrong);
  }

  const options = [...wrongOptions, answer].sort(() => Math.random() - 0.5);
  return { grid, missingIndex, answer, options };
}

const TOTAL_ROUNDS = 8;

export default function PatternGame() {
  const { settings, addPoints, recordGame } = useStore();
  const difficulty = settings.difficulty;
  const timeLimit = DIFFICULTY_CONFIG[difficulty].timeLimit;
  const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;

  const [problem, setProblem] = useState<PatternProblem>(generatePattern(difficulty));
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameOver, setGameOver] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const correctRef = useRef(correct);
  const scoreRef = useRef(score);
  const roundRef = useRef(round);
  correctRef.current = correct;
  scoreRef.current = score;
  roundRef.current = round;

  const gridAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    gridAnim.setValue(0);
    Animated.timing(gridAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [round]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleNext(correctRef.current, scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [round]);

  const handleNext = (c: number, s: number) => {
    clearInterval(timerRef.current);
    if (round >= TOTAL_ROUNDS) {
      finishGame(c, s);
    } else {
      setRound((r) => r + 1);
      setProblem(generatePattern(difficulty));
      setTimeLeft(timeLimit);
      setSelected(null);
    }
  };

  const finishGame = (finalCorrect: number, finalScore: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    addPoints(finalScore);
    recordGame('pattern', finalCorrect >= TOTAL_ROUNDS * 0.6, timeTaken);
    setGameOver(true);
  };

  const handleAnswer = (shapeIdx: number) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    setSelected(shapeIdx);

    let newScore = score;
    let newCorrect = correct;
    if (shapeIdx === problem.answer) {
      const points = Math.round(15 * multiplier);
      newScore = score + points;
      newCorrect = correct + 1;
      setScore(newScore);
      setCorrect(newCorrect);
    }

    setTimeout(() => handleNext(newCorrect, newScore), 600);
  };

  const resetGame = () => {
    setScore(0);
    setRound(1);
    setCorrect(0);
    setTimeLeft(timeLimit);
    setGameOver(false);
    setSelected(null);
    setProblem(generatePattern(difficulty));
  };

  if (gameOver) {
    return (
      <GameComplete
        score={score}
        correct={correct}
        total={TOTAL_ROUNDS}
        gameTitle="Pattern Match"
        onPlayAgain={resetGame}
        gameId="pattern"
      />
    );
  }

  const cols = problem.grid.length <= 4 ? 2 : 3;

  return (
    <GameShell title="Pattern Match" color="#7B61FF" score={score} timeLeft={timeLeft} gameId="pattern">
      <View style={styles.roundRow}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.roundPip,
              i < round - 1 && { backgroundColor: '#7B61FF' },
              i === round - 1 && { backgroundColor: '#7B61FF', width: 16 },
            ]}
          />
        ))}
      </View>

      <Text style={styles.instruction}>Find the missing piece</Text>

      <Animated.View
        style={[
          styles.grid,
          { maxWidth: cols * 80 },
          { opacity: gridAnim, transform: [{ scale: gridAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] },
        ]}
      >
        {problem.grid.map((shapeIdx, i) => {
          const isMissing = i === problem.missingIndex;
          return (
            <View
              key={i}
              style={[
                styles.gridCell,
                isMissing && styles.missingCell,
              ]}
            >
              {isMissing ? (
                <Text style={styles.questionMark}>?</Text>
              ) : (
                <Text style={[styles.shape, { color: AURORA_COLORS[shapeIdx] }]}>
                  {SHAPES[shapeIdx]}
                </Text>
              )}
            </View>
          );
        })}
      </Animated.View>

      <Text style={styles.chooseText}>Choose the correct shape</Text>

      <View style={styles.optionsRow}>
        {problem.options.map((shapeIdx, i) => {
          let borderColor = theme.cardBorder;
          let bgColor = theme.cardBg;

          if (selected !== null) {
            if (shapeIdx === problem.answer) {
              borderColor = '#22C55E';
              bgColor = 'rgba(34,197,94,0.15)';
            } else if (shapeIdx === selected) {
              borderColor = '#EF4444';
              bgColor = 'rgba(239,68,68,0.15)';
            }
          }

          return (
            <TouchableOpacity
              key={i}
              style={[styles.optionButton, { backgroundColor: bgColor, borderColor }]}
              onPress={() => handleAnswer(shapeIdx)}
              disabled={selected !== null}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionShape,
                  {
                    color: selected !== null && (shapeIdx === problem.answer || shapeIdx === selected)
                      ? '#FFF'
                      : AURORA_COLORS[shapeIdx],
                  },
                ]}
              >
                {SHAPES[shapeIdx]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginBottom: Spacing.md,
  },
  roundPip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  instruction: {
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    marginBottom: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  gridCell: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(123,97,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123,97,255,0.15)',
  },
  missingCell: {
    borderWidth: 2,
    borderColor: 'rgba(123,97,255,0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(123,97,255,0.08)',
  },
  shape: {
    fontSize: 32,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  questionMark: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: '#7B61FF',
    textShadowColor: 'rgba(123,97,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  chooseText: {
    textAlign: 'center',
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  optionButton: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  optionShape: {
    fontSize: 36,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
