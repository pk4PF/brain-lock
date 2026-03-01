import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import GameShell, { GAME_THEMES } from '../../src/components/GameShell';
import GameComplete from '../../src/components/GameComplete';
import { soundTap, soundCorrect, soundWrong, soundRound } from '../../src/utils/sounds';

const T = GAME_THEMES.wordscramble;

// Words sorted by length for progressive difficulty
const WORDS_3 = ['CAT', 'DOG', 'SUN', 'RUN', 'CUP', 'HAT', 'BIG', 'RED', 'TOP', 'FUN', 'MAP', 'PEN', 'BOX', 'JAR', 'NET'];
const WORDS_4 = ['BRAIN', 'SMART', 'FOCUS', 'THINK', 'POWER', 'LEARN', 'SOLVE', 'TRAIN', 'SHARP', 'QUICK', 'LOGIC', 'CRAFT', 'STORM', 'DREAM', 'FLAME'];
const WORDS_5 = ['BRAIN', 'SMART', 'FOCUS', 'THINK', 'POWER', 'LEARN', 'SOLVE', 'TRAIN', 'SHARP', 'QUICK', 'LOGIC', 'CRAFT', 'STORM', 'DREAM', 'FLAME'];
const WORDS_6 = ['PUZZLE', 'MENTAL', 'GENIUS', 'MEMORY', 'ROCKET', 'STREAK', 'UNLOCK', 'BRIDGE', 'MUSCLE', 'PLANET', 'CASTLE', 'FROZEN', 'MASTER', 'WONDER', 'CIRCLE'];

// Round → word pool: rounds 1-2: 3-letter, 3-4: 4-letter, 5-6: 5-letter, 7-8: 6-letter
function getPoolForRound(round: number): string[] {
  if (round <= 2) return WORDS_3;
  if (round <= 4) return WORDS_4;
  if (round <= 6) return WORDS_5;
  return WORDS_6;
}

const TIME_STAGES = [25, 25, 20, 20, 18, 18, 15, 15];
const MULT_STAGES = [1, 1, 1.2, 1.2, 1.5, 1.5, 1.8, 2];

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

interface WordPuzzle { word: string; scrambled: string; }

function getRandomWord(round: number, used: Set<string>): WordPuzzle {
  const pool = getPoolForRound(round);
  const available = pool.filter((w) => !used.has(w));
  const word = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : pool[Math.floor(Math.random() * pool.length)];
  return { word, scrambled: scrambleWord(word) };
}

const TOTAL_ROUNDS = 8;

export default function WordScrambleGame() {
  const { addPoints, recordGame, completeDailyGame } = useStore();

  const usedWords = useRef(new Set<string>());
  const [puzzle, setPuzzle] = useState<WordPuzzle>(getRandomWord(1, usedWords.current));
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_STAGES[0]);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'reveal' | null>(null);
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

  useEffect(() => { usedWords.current.add(puzzle.word); }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { handleSkip(); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [round]);

  const handleSkip = () => {
    clearInterval(timerRef.current);
    setFeedback('reveal');
    setTimeout(() => {
      if (roundRef.current >= TOTAL_ROUNDS) finishGame(correctRef.current, scoreRef.current);
      else nextRound(correctRef.current, scoreRef.current);
    }, 1200);
  };

  const nextRound = (c: number, s: number) => {
    const nextR = roundRef.current + 1;
    const newPuzzle = getRandomWord(nextR, usedWords.current);
    usedWords.current.add(newPuzzle.word);
    letterAnims.current = newPuzzle.scrambled.split('').map(() => new Animated.Value(1));
    setRound(nextR); setPuzzle(newPuzzle); setSelectedLetters([]);
    setCurrentGuess(''); setTimeLeft(TIME_STAGES[Math.min(nextR - 1, TIME_STAGES.length - 1)]); setFeedback(null);
  };

  const finishGame = (finalCorrect: number, finalScore: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    addPoints(finalScore);
    const won = finalCorrect >= TOTAL_ROUNDS * 0.5;
    recordGame('wordscramble', won, timeTaken);
    completeDailyGame();
    setGameOver(true);
  };

  const handleLetterTap = (index: number) => {
    if (feedback) return;
    if (selectedLetters.includes(index)) return;
    soundTap();
    Animated.timing(letterAnims.current[index], { toValue: 0.3, duration: 150, useNativeDriver: true }).start();
    const newSelected = [...selectedLetters, index];
    setSelectedLetters(newSelected);
    const newGuess = currentGuess + puzzle.scrambled[index];
    setCurrentGuess(newGuess);

    if (newGuess.length === puzzle.word.length) {
      clearInterval(timerRef.current);
      if (newGuess === puzzle.word) {
        soundCorrect();
        const mult = MULT_STAGES[Math.min(round - 1, MULT_STAGES.length - 1)];
        const points = Math.round(puzzle.word.length * 5 * mult);
        const newScore = score + points; const newCorrect = correct + 1;
        setScore(newScore); setCorrect(newCorrect); setFeedback('correct');
        setTimeout(() => { if (round >= TOTAL_ROUNDS) finishGame(newCorrect, newScore); else { soundRound(); nextRound(newCorrect, newScore); } }, 600);
      } else {
        soundWrong();
        setFeedback('wrong');
        setTimeout(() => {
          setFeedback('reveal');
        }, 600);
        setTimeout(() => {
          setSelectedLetters([]); setCurrentGuess(''); setFeedback(null);
          letterAnims.current.forEach((a) => a.setValue(1));
          timerRef.current = setInterval(() => {
            setTimeLeft((t) => { if (t <= 1) { handleSkip(); return 0; } return t - 1; });
          }, 1000);
        }, 1800);
      }
    }
  };

  const handleShuffle = () => {
    if (feedback) return;
    soundTap();
    const unselectedIndices = puzzle.scrambled.split('').map((_, i) => i).filter((i) => !selectedLetters.includes(i));
    const unselectedLetters = unselectedIndices.map((i) => puzzle.scrambled[i]);
    for (let i = unselectedLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unselectedLetters[i], unselectedLetters[j]] = [unselectedLetters[j], unselectedLetters[i]];
    }
    const newScrambled = puzzle.scrambled.split('');
    unselectedIndices.forEach((origIdx, i) => { newScrambled[origIdx] = unselectedLetters[i]; });
    setPuzzle({ ...puzzle, scrambled: newScrambled.join('') });
    letterAnims.current = newScrambled.map((_, i) => new Animated.Value(selectedLetters.includes(i) ? 0.3 : 1));
  };

  const handleUndo = () => {
    if (feedback || selectedLetters.length === 0) return;
    soundTap();
    const lastIdx = selectedLetters[selectedLetters.length - 1];
    Animated.timing(letterAnims.current[lastIdx], { toValue: 1, duration: 150, useNativeDriver: true }).start();
    setSelectedLetters(selectedLetters.slice(0, -1));
    setCurrentGuess(currentGuess.slice(0, -1));
  };

  const resetGame = () => {
    usedWords.current.clear(); setScore(0); setRound(1); setCorrect(0);
    setTimeLeft(TIME_STAGES[0]); setGameOver(false); setFeedback(null);
    setSelectedLetters([]); setCurrentGuess('');
    const newPuzzle = getRandomWord(1, usedWords.current);
    usedWords.current.add(newPuzzle.word);
    letterAnims.current = newPuzzle.scrambled.split('').map(() => new Animated.Value(1));
    setPuzzle(newPuzzle);
  };

  if (gameOver) {
    return <GameComplete score={score} correct={correct} total={TOTAL_ROUNDS} gameTitle="Word Scramble" onPlayAgain={resetGame} gameId="wordscramble" />;
  }

  return (
    <GameShell title="Word Scramble" color="#E8B84B" score={score} timeLeft={timeLeft} gameId="wordscramble" multiplier={MULT_STAGES[Math.min(round - 1, MULT_STAGES.length - 1)]}>
      <View style={styles.roundRow}>
        <Text style={styles.roundTxt}>{round} / {TOTAL_ROUNDS}</Text>
      </View>

      <Text style={styles.instruction}>Unscramble the word</Text>

      {/* Answer slots */}
      <View style={styles.answerRow}>
        {puzzle.word.split('').map((char, idx) => {
          const isReveal = feedback === 'reveal';
          const displayLetter = isReveal ? char : (currentGuess[idx] || '');
          const filled = isReveal || idx < currentGuess.length;
          const isCorrect = feedback === 'correct' && filled;
          const isWrong = feedback === 'wrong' && filled;
          return (
            <LinearGradient
              key={idx}
              colors={isReveal ? ['rgba(232,184,75,0.2)', 'rgba(232,184,75,0.08)']
                : isCorrect ? ['rgba(34,197,94,0.2)', 'rgba(34,197,94,0.06)']
                : isWrong ? ['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.06)']
                : filled ? ['rgba(232,184,75,0.15)', 'rgba(232,184,75,0.05)']
                : ['rgba(232,184,75,0.06)', 'rgba(232,184,75,0.02)']}
              style={[
                styles.answerSlot,
                filled && styles.slotFilled,
                isCorrect && styles.slotCorrect,
                isWrong && styles.slotWrong,
                isReveal && styles.slotReveal,
              ]}
            >
              <Text style={[
                styles.answerLetter,
                filled && styles.answerLetterFilled,
                isCorrect && { color: '#22C55E' },
                isWrong && { color: '#EF4444' },
                isReveal && { color: '#E8B84B' },
              ]}>
                {displayLetter}
              </Text>
            </LinearGradient>
          );
        })}
      </View>

      {feedback === 'reveal' && (
        <Text style={styles.revealLabel}>The word was {puzzle.word}</Text>
      )}

      {/* Scrambled letter tiles */}
      <View style={styles.lettersRow}>
        {puzzle.scrambled.split('').map((letter, idx) => {
          const isUsed = selectedLetters.includes(idx);
          return (
            <Animated.View key={idx} style={{ opacity: letterAnims.current[idx] || 1 }}>
              <TouchableOpacity
                onPress={() => handleLetterTap(idx)}
                disabled={isUsed || feedback !== null}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={isUsed ? ['rgba(232,184,75,0.08)', 'rgba(232,184,75,0.03)'] : ['#E8B84B', '#D4A43A']}
                  style={[styles.letterTile, isUsed && styles.letterTileUsed]}
                >
                  <Text style={[styles.letterText, isUsed && styles.letterTextUsed]}>{letter}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={handleUndo} disabled={feedback !== null}>
          <LinearGradient colors={['rgba(232,184,75,0.1)', 'rgba(232,184,75,0.04)']} style={styles.actionBtn}>
            <Text style={styles.actionTxt}>Undo</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShuffle} disabled={feedback !== null}>
          <LinearGradient colors={['rgba(232,184,75,0.1)', 'rgba(232,184,75,0.04)']} style={styles.actionBtn}>
            <Text style={styles.actionTxt}>Shuffle</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip} disabled={feedback !== null}>
          <LinearGradient colors={['rgba(232,184,75,0.1)', 'rgba(232,184,75,0.04)']} style={styles.actionBtn}>
            <Text style={styles.actionTxt}>Skip</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  roundRow: { alignItems: 'center', marginBottom: 8 },
  roundTxt: { fontSize: 13, color: 'rgba(255,248,231,0.4)', fontFamily: FontFamily.semibold },
  instruction: { textAlign: 'center', fontSize: 18, fontFamily: FontFamily.bold, color: '#FFF8E7', marginBottom: 28, letterSpacing: 0.3 },
  answerRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  answerSlot: {
    width: 44, height: 54, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(232,184,75,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  slotFilled: { borderColor: '#E8B84B' },
  slotCorrect: { borderColor: '#22C55E' },
  slotWrong: { borderColor: '#EF4444' },
  slotReveal: { borderColor: '#E8B84B' },
  answerLetter: { fontSize: 22, fontFamily: FontFamily.bold, color: 'rgba(232,184,75,0.25)' },
  answerLetterFilled: { color: '#E8B84B' },
  revealLabel: { textAlign: 'center', fontSize: 14, fontFamily: FontFamily.semibold, color: 'rgba(232,184,75,0.7)', marginBottom: 16 },
  lettersRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 28 },
  letterTile: {
    width: 50, height: 58, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#E8B84B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  letterTileUsed: { shadowOpacity: 0 },
  letterText: { fontSize: 22, fontFamily: FontFamily.bold, color: '#1A1207' },
  letterTextUsed: { color: 'rgba(232,184,75,0.25)' },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  actionBtn: {
    paddingVertical: 10, paddingHorizontal: 28, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(232,184,75,0.15)',
  },
  actionTxt: { fontSize: 14, color: 'rgba(255,248,231,0.5)', fontFamily: FontFamily.semibold },
});
