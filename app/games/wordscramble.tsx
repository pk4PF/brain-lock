import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { DIFFICULTY_CONFIG } from '../../src/constants/games';
import GameShell, { GAME_THEMES } from '../../src/components/GameShell';
import GameComplete from '../../src/components/GameComplete';

const theme = GAME_THEMES.wordscramble;

const WORD_POOLS: Record<string, string[]> = {
  easy: ['CAT', 'DOG', 'SUN', 'RUN', 'CUP', 'HAT', 'BIG', 'RED', 'TOP', 'FUN', 'MAP', 'PEN', 'BOX', 'JAR', 'NET'],
  medium: ['BRAIN', 'SMART', 'FOCUS', 'THINK', 'POWER', 'LEARN', 'SOLVE', 'TRAIN', 'SHARP', 'QUICK', 'LOGIC', 'CRAFT', 'STORM', 'DREAM', 'FLAME'],
  hard: ['PUZZLE', 'MENTAL', 'GENIUS', 'MEMORY', 'ROCKET', 'STREAK', 'UNLOCK', 'BRIDGE', 'MUSCLE', 'PLANET', 'CASTLE', 'FROZEN', 'MASTER', 'WONDER', 'CIRCLE'],
};

function scrambleWord(word: string): string {
  const letters = word.split('');
  let scrambled = word;
  let attempts = 0;
  while (scrambled === word && attempts < 20) {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    scrambled = letters.join('');
    attempts++;
  }
  return scrambled;
}

interface WordPuzzle {
  word: string;
  scrambled: string;
}

function getRandomWord(difficulty: string, used: Set<string>): WordPuzzle {
  const pool = WORD_POOLS[difficulty] || WORD_POOLS.medium;
  const available = pool.filter((w) => !used.has(w));
  const word = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : pool[Math.floor(Math.random() * pool.length)];
  return { word, scrambled: scrambleWord(word) };
}

const TOTAL_ROUNDS = 8;

export default function WordScrambleGame() {
  const { settings, addPoints, recordGame } = useStore();
  const difficulty = settings.difficulty;
  const timeLimit = DIFFICULTY_CONFIG[difficulty].timeLimit + 5;
  const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;

  const usedWords = useRef(new Set<string>());
  const [puzzle, setPuzzle] = useState<WordPuzzle>(getRandomWord(difficulty, usedWords.current));
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const correctRef = useRef(correct);
  const scoreRef = useRef(score);
  const roundRef = useRef(round);
  correctRef.current = correct;
  scoreRef.current = score;
  roundRef.current = round;

  const letterAnims = useRef<Animated.Value[]>([]);
  if (letterAnims.current.length !== puzzle.scrambled.length) {
    letterAnims.current = puzzle.scrambled.split('').map(() => new Animated.Value(1));
  }

  useEffect(() => {
    usedWords.current.add(puzzle.word);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleSkip();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [round]);

  const handleSkip = () => {
    clearInterval(timerRef.current);
    if (roundRef.current >= TOTAL_ROUNDS) {
      finishGame(correctRef.current, scoreRef.current);
    } else {
      nextRound(correctRef.current, scoreRef.current);
    }
  };

  const nextRound = (c: number, s: number) => {
    const newPuzzle = getRandomWord(difficulty, usedWords.current);
    usedWords.current.add(newPuzzle.word);
    letterAnims.current = newPuzzle.scrambled.split('').map(() => new Animated.Value(1));
    setRound((r) => r + 1);
    setPuzzle(newPuzzle);
    setSelectedLetters([]);
    setCurrentGuess('');
    setTimeLeft(timeLimit);
    setFeedback(null);
  };

  const finishGame = (finalCorrect: number, finalScore: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    addPoints(finalScore);
    recordGame('wordscramble', finalCorrect >= TOTAL_ROUNDS * 0.5, timeTaken);
    setGameOver(true);
  };

  const handleLetterTap = (index: number) => {
    if (feedback) return;
    if (selectedLetters.includes(index)) return;

    Animated.timing(letterAnims.current[index], { toValue: 0.3, duration: 150, useNativeDriver: true }).start();

    const newSelected = [...selectedLetters, index];
    setSelectedLetters(newSelected);
    const newGuess = currentGuess + puzzle.scrambled[index];
    setCurrentGuess(newGuess);

    if (newGuess.length === puzzle.word.length) {
      clearInterval(timerRef.current);
      if (newGuess === puzzle.word) {
        const points = Math.round(puzzle.word.length * 5 * multiplier);
        const newScore = score + points;
        const newCorrect = correct + 1;
        setScore(newScore);
        setCorrect(newCorrect);
        setFeedback('correct');

        setTimeout(() => {
          if (round >= TOTAL_ROUNDS) {
            finishGame(newCorrect, newScore);
          } else {
            nextRound(newCorrect, newScore);
          }
        }, 600);
      } else {
        setFeedback('wrong');
        setTimeout(() => {
          setSelectedLetters([]);
          setCurrentGuess('');
          setFeedback(null);
          letterAnims.current.forEach((a) => a.setValue(1));
          timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
              if (t <= 1) {
                handleSkip();
                return 0;
              }
              return t - 1;
            });
          }, 1000);
        }, 600);
      }
    }
  };

  const handleUndo = () => {
    if (feedback || selectedLetters.length === 0) return;
    const lastIdx = selectedLetters[selectedLetters.length - 1];
    Animated.timing(letterAnims.current[lastIdx], { toValue: 1, duration: 150, useNativeDriver: true }).start();
    setSelectedLetters(selectedLetters.slice(0, -1));
    setCurrentGuess(currentGuess.slice(0, -1));
  };

  const resetGame = () => {
    usedWords.current.clear();
    setScore(0);
    setRound(1);
    setCorrect(0);
    setTimeLeft(timeLimit);
    setGameOver(false);
    setFeedback(null);
    setSelectedLetters([]);
    setCurrentGuess('');
    const newPuzzle = getRandomWord(difficulty, usedWords.current);
    usedWords.current.add(newPuzzle.word);
    letterAnims.current = newPuzzle.scrambled.split('').map(() => new Animated.Value(1));
    setPuzzle(newPuzzle);
  };

  if (gameOver) {
    return (
      <GameComplete
        score={score}
        correct={correct}
        total={TOTAL_ROUNDS}
        gameTitle="Word Scramble"
        onPlayAgain={resetGame}
        gameId="wordscramble"
      />
    );
  }

  return (
    <GameShell title="Word Scramble" color="#E8B84B" score={score} timeLeft={timeLeft} gameId="wordscramble">
      <View style={styles.roundRow}>
        <Text style={styles.roundText}>{round} / {TOTAL_ROUNDS}</Text>
      </View>

      <Text style={styles.instruction}>Unscramble the word</Text>

      <View style={styles.answerRow}>
        {puzzle.word.split('').map((_, idx) => {
          const letter = currentGuess[idx] || '';
          const isFilled = idx < currentGuess.length;
          return (
            <View
              key={idx}
              style={[
                styles.answerSlot,
                isFilled && styles.answerSlotFilled,
                feedback === 'correct' && isFilled && styles.answerSlotCorrect,
                feedback === 'wrong' && isFilled && styles.answerSlotWrong,
              ]}
            >
              <Text
                style={[
                  styles.answerLetter,
                  isFilled && styles.answerLetterFilled,
                  feedback === 'correct' && { color: '#22C55E' },
                  feedback === 'wrong' && { color: '#EF4444' },
                ]}
              >
                {letter}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.lettersRow}>
        {puzzle.scrambled.split('').map((letter, idx) => {
          const isUsed = selectedLetters.includes(idx);
          return (
            <Animated.View key={idx} style={{ opacity: letterAnims.current[idx] || 1 }}>
              <TouchableOpacity
                style={[styles.letterButton, isUsed && styles.letterButtonUsed]}
                onPress={() => handleLetterTap(idx)}
                disabled={isUsed || feedback !== null}
                activeOpacity={0.7}
              >
                <Text style={[styles.letterText, isUsed && styles.letterTextUsed]}>
                  {letter}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleUndo}>
          <Text style={styles.actionText}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleSkip}>
          <Text style={styles.actionText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  roundRow: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  roundText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,248,231,0.5)',
    fontWeight: FontWeight.semibold,
  },
  instruction: {
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFF8E7',
    marginBottom: Spacing.xl,
    letterSpacing: 0.5,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.xxl,
  },
  answerSlot: {
    width: 44,
    height: 52,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(232,184,75,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(232,184,75,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerSlotFilled: {
    borderColor: '#E8B84B',
    backgroundColor: 'rgba(232,184,75,0.1)',
  },
  answerSlotCorrect: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  answerSlotWrong: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  answerLetter: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: 'rgba(232,184,75,0.3)',
  },
  answerLetterFilled: {
    color: '#E8B84B',
  },
  lettersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: Spacing.xl,
  },
  letterButton: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: '#E8B84B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E8B84B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  letterButtonUsed: {
    backgroundColor: 'rgba(232,184,75,0.15)',
    shadowOpacity: 0,
  },
  letterText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#1A1207',
  },
  letterTextUsed: {
    color: 'rgba(232,184,75,0.3)',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  actionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(232,184,75,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232,184,75,0.2)',
  },
  actionText: {
    fontSize: FontSize.md,
    color: 'rgba(255,248,231,0.6)',
    fontWeight: FontWeight.semibold,
  },
});
