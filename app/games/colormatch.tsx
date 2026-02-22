import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { DIFFICULTY_CONFIG } from '../../src/constants/games';
import GameShell, { GAME_THEMES } from '../../src/components/GameShell';
import GameComplete from '../../src/components/GameComplete';

const theme = GAME_THEMES.colormatch;

const COLOR_MAP: Record<string, string> = {
  RED: '#FF4D6D',
  BLUE: '#4DA6FF',
  GREEN: '#4DFF88',
  YELLOW: '#FFD93D',
  PURPLE: '#B44DFF',
  ORANGE: '#FF8C4D',
  PINK: '#FF69B4',
  CYAN: '#4DFFF0',
};

const COLOR_NAMES = Object.keys(COLOR_MAP);

interface ColorChallenge {
  text: string;
  textColor: string;
  isMatch: boolean;
}

function generateChallenge(difficulty: string): ColorChallenge {
  const textName = COLOR_NAMES[Math.floor(Math.random() * (difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8))];
  const shouldMatch = Math.random() > 0.5;

  if (shouldMatch) {
    return { text: textName, textColor: textName, isMatch: true };
  } else {
    let colorName = textName;
    while (colorName === textName) {
      colorName = COLOR_NAMES[Math.floor(Math.random() * (difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8))];
    }
    return { text: textName, textColor: colorName, isMatch: false };
  }
}

const TOTAL_ROUNDS = 12;

export default function ColorMatchGame() {
  const { settings, addPoints, recordGame } = useStore();
  const difficulty = settings.difficulty;
  const timeLimit = DIFFICULTY_CONFIG[difficulty].timeLimit;
  const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;

  const [challenge, setChallenge] = useState<ColorChallenge>(generateChallenge(difficulty));
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

  const cardAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    cardAnim.setValue(0.9);
    Animated.spring(cardAnim, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }).start();
  }, [round]);

  useEffect(() => {
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
      setChallenge(generateChallenge(difficulty));
      setTimeLeft(timeLimit);
      setFeedback(null);
    }
  }, [difficulty, timeLimit]);

  const finishGame = (finalCorrect: number, finalScore: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    addPoints(finalScore);
    recordGame('colormatch', finalCorrect >= TOTAL_ROUNDS * 0.6, timeTaken);
    setGameOver(true);
  };

  const handleAnswer = (playerSaysMatch: boolean) => {
    if (feedback) return;
    clearInterval(timerRef.current);

    const isRight = playerSaysMatch === challenge.isMatch;
    setFeedback(isRight ? 'correct' : 'wrong');

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
        setChallenge(generateChallenge(difficulty));
        setTimeLeft(timeLimit);
        setFeedback(null);
      }
    }, 500);
  };

  const resetGame = () => {
    setScore(0);
    setRound(1);
    setCorrect(0);
    setTimeLeft(timeLimit);
    setGameOver(false);
    setFeedback(null);
    setChallenge(generateChallenge(difficulty));
  };

  if (gameOver) {
    return (
      <GameComplete
        score={score}
        correct={correct}
        total={TOTAL_ROUNDS}
        gameTitle="Color Match"
        onPlayAgain={resetGame}
        gameId="colormatch"
      />
    );
  }

  return (
    <GameShell title="Color Match" color="#FF69B4" score={score} timeLeft={timeLeft} gameId="colormatch">
      <Animated.View style={[styles.flashOverlay, { opacity: flashAnim }]} pointerEvents="none" />

      <View style={styles.roundRow}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.roundDot,
              i < round - 1 && { backgroundColor: '#FF69B4' },
              i === round - 1 && { backgroundColor: '#FF69B4', width: 12 },
            ]}
          />
        ))}
      </View>

      <Text style={styles.instruction}>
        Does the text color match the word?
      </Text>

      <Animated.View style={[styles.wordCard, { transform: [{ scale: cardAnim }] }]}>
        <Text
          style={[
            styles.colorWord,
            { color: COLOR_MAP[challenge.textColor] },
            feedback === 'correct' && styles.colorWordCorrect,
            feedback === 'wrong' && styles.colorWordWrong,
          ]}
        >
          {challenge.text}
        </Text>
        <View style={styles.hintRow}>
          <View style={[styles.hintDot, { backgroundColor: COLOR_MAP[challenge.textColor] }]} />
          <Text style={styles.hintText}>displayed in this color</Text>
        </View>
      </Animated.View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[
            styles.matchButton,
            feedback === 'correct' && challenge.isMatch && styles.buttonCorrect,
            feedback === 'wrong' && !challenge.isMatch && styles.buttonWrong,
          ]}
          onPress={() => handleAnswer(true)}
          disabled={feedback !== null}
          activeOpacity={0.7}
        >
          <Text style={styles.matchButtonText}>MATCH</Text>
          <Text style={styles.matchButtonSub}>Colors match</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.noMatchButton,
            feedback === 'correct' && !challenge.isMatch && styles.buttonCorrect,
            feedback === 'wrong' && challenge.isMatch && styles.buttonWrong,
          ]}
          onPress={() => handleAnswer(false)}
          disabled={feedback !== null}
          activeOpacity={0.7}
        >
          <Text style={styles.noMatchButtonText}>NO MATCH</Text>
          <Text style={styles.noMatchButtonSub}>Colors differ</Text>
        </TouchableOpacity>
      </View>

      {feedback && (
        <View style={styles.feedbackRow}>
          <Text style={[styles.feedbackText, { color: feedback === 'correct' ? '#22C55E' : '#FF4D6D' }]}>
            {feedback === 'correct' ? 'Correct!' : `Wrong! The word "${challenge.text}" was in ${challenge.textColor}`}
          </Text>
        </View>
      )}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,105,180,0.05)',
    borderRadius: 20,
  },
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: Spacing.lg,
  },
  roundDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  instruction: {
    textAlign: 'center',
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xxl,
  },
  wordCard: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxxl,
    paddingHorizontal: Spacing.xxxxl,
    backgroundColor: 'rgba(255,105,180,0.06)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,105,180,0.15)',
    marginBottom: Spacing.xxxl,
    width: '100%',
  },
  colorWord: {
    fontSize: 48,
    fontWeight: FontWeight.heavy,
    letterSpacing: 4,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: Spacing.md,
  },
  colorWordCorrect: {
    textShadowColor: 'rgba(34,197,94,0.5)',
  },
  colorWordWrong: {
    textShadowColor: 'rgba(255,77,109,0.5)',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hintText: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.3)',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  matchButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    alignItems: 'center',
  },
  matchButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#22C55E',
    marginBottom: 2,
  },
  matchButtonSub: {
    fontSize: FontSize.xs,
    color: 'rgba(34,197,94,0.5)',
  },
  noMatchButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,77,109,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,109,0.3)',
    alignItems: 'center',
  },
  noMatchButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FF4D6D',
    marginBottom: 2,
  },
  noMatchButtonSub: {
    fontSize: FontSize.xs,
    color: 'rgba(255,77,109,0.5)',
  },
  buttonCorrect: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34,197,94,0.2)',
  },
  buttonWrong: {
    borderColor: '#FF4D6D',
    backgroundColor: 'rgba(255,77,109,0.2)',
  },
  feedbackRow: {
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
