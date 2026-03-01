import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import GameShell, { GAME_THEMES } from '../../src/components/GameShell';
import GameComplete from '../../src/components/GameComplete';
import { soundTap, soundCorrect, soundWrong, soundRound } from '../../src/utils/sounds';

const T = GAME_THEMES.colormatch;

const COLOR_MAP: Record<string, string> = {
  RED: '#FF4D6D', BLUE: '#4DA6FF', GREEN: '#4DFF88', YELLOW: '#FFD93D',
  PURPLE: '#B87DFF', ORANGE: '#FF8C42',
};
const COLOR_NAMES = Object.keys(COLOR_MAP);

// Time limit per round shrinks as you progress
const TIME_STAGES = [8, 7, 6, 5, 4, 4, 3, 3, 3, 2, 2, 2];
const MULT_STAGES = [1, 1, 1, 1.2, 1.2, 1.5, 1.5, 1.5, 1.8, 1.8, 2, 2];

interface ColorChallenge { text: string; textColor: string; isMatch: boolean; }

function generateChallenge(): ColorChallenge {
  const textName = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
  const shouldMatch = Math.random() > 0.5;
  if (shouldMatch) return { text: textName, textColor: textName, isMatch: true };
  let colorName = textName;
  while (colorName === textName) colorName = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
  return { text: textName, textColor: colorName, isMatch: false };
}

const TOTAL_ROUNDS = 12;

export default function ColorMatchGame() {
  const { addPoints, recordGame, completeDailyGame } = useStore();

  const getRoundTime = (r: number) => TIME_STAGES[Math.min(r - 1, TIME_STAGES.length - 1)];

  const [challenge, setChallenge] = useState<ColorChallenge>(generateChallenge());
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(getRoundTime(1));
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
  const timerPulse = useRef(new Animated.Value(1)).current;
  const maxRoundTime = getRoundTime(round);

  useEffect(() => {
    cardAnim.setValue(0.9);
    Animated.spring(cardAnim, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }).start();
  }, [round]);

  useEffect(() => {
    if (timeLeft <= 2 && timeLeft > 0) {
      Animated.sequence([
        Animated.timing(timerPulse, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(timerPulse, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [timeLeft]);

  // Timer just counts down — never calls handler from inside updater
  useEffect(() => {
    if (gameOver || feedback) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [round, gameOver, feedback]);

  // Handle timeout separately when timeLeft hits 0
  useEffect(() => {
    if (timeLeft !== 0 || feedback || gameOver) return;
    clearInterval(timerRef.current);
    const nextRound = roundRef.current + 1;
    if (roundRef.current >= TOTAL_ROUNDS) finishGame(correctRef.current, scoreRef.current);
    else { setRound(nextRound); setChallenge(generateChallenge()); setTimeLeft(getRoundTime(nextRound)); setFeedback(null); }
  }, [timeLeft]);

  const finishGame = (finalCorrect: number, finalScore: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    addPoints(finalScore);
    const won = finalCorrect >= TOTAL_ROUNDS * 0.6;
    recordGame('colormatch', won, timeTaken);
    completeDailyGame();
    setGameOver(true);
  };

  const handleAnswer = (playerSaysMatch: boolean) => {
    if (feedback) return;
    soundTap();
    clearInterval(timerRef.current);
    const isRight = playerSaysMatch === challenge.isMatch;
    setFeedback(isRight ? 'correct' : 'wrong');
    if (isRight) soundCorrect(); else soundWrong();
    let newScore = score; let newCorrect = correct;
    if (isRight) {
      const mult = MULT_STAGES[Math.min(round - 1, MULT_STAGES.length - 1)];
      const points = Math.round(10 * mult);
      newScore = score + points; newCorrect = correct + 1;
      setScore(newScore); setCorrect(newCorrect);
    }
    const nextRound = round + 1;
    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) finishGame(newCorrect, newScore);
      else { soundRound(); setRound(nextRound); setChallenge(generateChallenge()); setTimeLeft(getRoundTime(nextRound)); setFeedback(null); }
    }, 500);
  };

  const resetGame = () => {
    setScore(0); setRound(1); setCorrect(0); setTimeLeft(getRoundTime(1));
    setGameOver(false); setFeedback(null); setChallenge(generateChallenge());
  };

  if (gameOver) {
    return <GameComplete score={score} correct={correct} total={TOTAL_ROUNDS} gameTitle="Color Match" onPlayAgain={resetGame} gameId="colormatch" />;
  }

  const cardBorder = feedback === 'correct' ? 'rgba(34,197,94,0.3)' : feedback === 'wrong' ? 'rgba(255,77,109,0.3)' : 'rgba(255,255,255,0.08)';

  // Button colors: only flash green/red on feedback, otherwise neutral
  const matchBtnColors: [string, string] = feedback === 'correct' && challenge.isMatch
    ? ['rgba(34,197,94,0.2)', 'rgba(34,197,94,0.08)']
    : feedback === 'wrong' && !challenge.isMatch
    ? ['rgba(255,77,109,0.2)', 'rgba(255,77,109,0.08)']
    : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'];
  const matchBtnBorder = feedback === 'correct' && challenge.isMatch ? '#22C55E' : feedback === 'wrong' && !challenge.isMatch ? '#FF4D6D' : 'rgba(255,255,255,0.1)';

  const noMatchBtnColors: [string, string] = feedback === 'correct' && !challenge.isMatch
    ? ['rgba(34,197,94,0.2)', 'rgba(34,197,94,0.08)']
    : feedback === 'wrong' && challenge.isMatch
    ? ['rgba(255,77,109,0.2)', 'rgba(255,77,109,0.08)']
    : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'];
  const noMatchBtnBorder = feedback === 'correct' && !challenge.isMatch ? '#22C55E' : feedback === 'wrong' && challenge.isMatch ? '#FF4D6D' : 'rgba(255,255,255,0.1)';

  return (
    <GameShell title="Color Match" color="#FF69B4" score={score} gameId="colormatch" multiplier={MULT_STAGES[Math.min(round - 1, MULT_STAGES.length - 1)]}>
      {/* Pips */}
      <View style={styles.pips}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View key={i} style={[styles.pip, i < round - 1 && styles.pipDone, i === round - 1 && styles.pipActive]} />
        ))}
      </View>

      <Text style={styles.instruction}>Does the text color match the word?</Text>

      {/* Color word card */}
      <Animated.View style={{ transform: [{ scale: cardAnim }] }}>
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
          style={[styles.wordCard, { borderColor: cardBorder }]}
        >
          {/* Timer badge */}
          <Animated.View style={[styles.timerBadge, timeLeft <= 2 && styles.timerBadgeLow, { transform: [{ scale: timerPulse }] }]}>
            <Text style={[styles.timerNum, timeLeft <= 2 && styles.timerNumLow]}>{timeLeft}</Text>
          </Animated.View>

          <Text
            style={[
              styles.colorWord,
              { color: COLOR_MAP[challenge.textColor] },
            ]}
          >
            {challenge.text}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Answer buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.btnTouch}
          onPress={() => handleAnswer(true)}
          disabled={feedback !== null}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={matchBtnColors}
            style={[styles.answerBtn, { borderColor: matchBtnBorder }]}
          >
            <Text style={[styles.btnTxt, feedback === 'correct' && challenge.isMatch && { color: '#22C55E' }, feedback === 'wrong' && !challenge.isMatch && { color: '#FF4D6D' }]}>MATCH</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnTouch}
          onPress={() => handleAnswer(false)}
          disabled={feedback !== null}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={noMatchBtnColors}
            style={[styles.answerBtn, { borderColor: noMatchBtnBorder }]}
          >
            <Text style={[styles.btnTxt, feedback === 'correct' && !challenge.isMatch && { color: '#22C55E' }, feedback === 'wrong' && challenge.isMatch && { color: '#FF4D6D' }]}>NO MATCH</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  pips: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginBottom: 20 },
  pip: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,105,180,0.12)' },
  pipDone: { backgroundColor: '#FF69B4' },
  pipActive: { backgroundColor: '#FF69B4' },
  instruction: { textAlign: 'center', fontSize: 15, color: 'rgba(255,232,243,0.45)', fontFamily: FontFamily.semibold, marginBottom: 28 },
  wordCard: {
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 52, paddingHorizontal: 44,
    borderRadius: 24, borderWidth: 1,
    marginBottom: 36, width: '100%',
  },
  timerBadge: {
    position: 'absolute', top: 12, right: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  timerBadgeLow: { backgroundColor: 'rgba(255,68,68,0.15)' },
  timerNum: { fontSize: 16, fontFamily: FontFamily.bold, color: 'rgba(255,255,255,0.5)' },
  timerNumLow: { color: '#FF4444' },
  colorWord: {
    fontSize: 48, fontFamily: FontFamily.heavy, letterSpacing: 4,
  },
  btnRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  btnTouch: { flex: 1 },
  answerBtn: { paddingVertical: 22, borderRadius: 18, alignItems: 'center', borderWidth: 1 },
  btnTxt: { fontSize: 17, fontFamily: FontFamily.bold, color: 'rgba(255,255,255,0.7)' },
});
