import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import GameShell, { GAME_THEMES } from '../../src/components/GameShell';
import GameComplete from '../../src/components/GameComplete';
import { soundTap, soundCorrect, soundWrong, soundRound, soundCountdown } from '../../src/utils/sounds';
import { getGamePassages, type Passage } from '../../src/constants/passages';

const T = GAME_THEMES.speedread;
const TOTAL_ROUNDS = 6;
const WPM_STAGES = [340, 500, 650, 800, 900, 900];
const MULT_STAGES = [1, 1, 1.2, 1.5, 1.8, 2];

export default function SpeedReadGame() {
  const { addPoints, recordGame, completeDailyGame } = useStore();

  const [passages] = useState<Passage[]>(() => getGamePassages());
  const [phase, setPhase] = useState<'countdown' | 'reading' | 'question' | 'feedback'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const startTime = useRef(Date.now());
  const wordAnim = useRef(new Animated.Value(0)).current;
  const countdownAnim = useRef(new Animated.Value(1)).current;
  const passage = passages[Math.min(round - 1, passages.length - 1)];
  const currentWpm = WPM_STAGES[Math.min(round - 1, WPM_STAGES.length - 1)];
  const msPerWord = Math.round(60000 / currentWpm);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('reading');
      return;
    }
    soundCountdown();
    countdownAnim.setValue(1.3);
    Animated.timing(countdownAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, phase]);

  // Word reading timer
  useEffect(() => {
    if (phase !== 'reading') return;
    if (currentWordIdx >= passage.words.length) { setPhase('question'); return; }
    wordAnim.setValue(0);
    Animated.timing(wordAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
    const timer = setTimeout(() => setCurrentWordIdx((i) => i + 1), msPerWord);
    return () => clearTimeout(timer);
  }, [currentWordIdx, phase]);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    soundTap();
    setSelected(idx); setPhase('feedback');
    let newScore = score; let newCorrect = correct;
    if (idx === passage.answer) {
      soundCorrect();
      const mult = MULT_STAGES[Math.min(round - 1, MULT_STAGES.length - 1)];
      const points = Math.round(20 * mult);
      newScore = score + points; newCorrect = correct + 1;
      setScore(newScore); setCorrect(newCorrect);
    } else {
      soundWrong();
    }
    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) finishGame(newCorrect, newScore);
      else {
        soundRound();
        setRound((r) => r + 1);
        setCurrentWordIdx(0);
        setSelected(null);
        setCountdown(3);
        setPhase('countdown');
      }
    }, 800);
  };

  const finishGame = (finalCorrect: number, finalScore: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    addPoints(finalScore);
    const won = finalCorrect >= TOTAL_ROUNDS * 0.5;
    recordGame('speedread', won, timeTaken);
    completeDailyGame();
    setGameOver(true);
  };

  const resetGame = () => {
    setScore(0); setRound(1); setCorrect(0); setGameOver(false);
    setCurrentWordIdx(0); setSelected(null);
    setCountdown(3); setPhase('countdown');
  };

  if (gameOver) {
    return <GameComplete score={score} correct={correct} total={TOTAL_ROUNDS} gameTitle="Speed Reader" onPlayAgain={resetGame} gameId="speedread" />;
  }

  return (
    <GameShell title="Speed Reader" color="#FF6B35" score={score} gameId="speedread" multiplier={MULT_STAGES[Math.min(round - 1, MULT_STAGES.length - 1)]}>
      {/* Pips */}
      <View style={styles.pips}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View key={i} style={[styles.pip, i < round - 1 && styles.pipDone, i === round - 1 && styles.pipActive]} />
        ))}
      </View>

      <LinearGradient colors={['rgba(255,107,53,0.15)', 'rgba(255,107,53,0.04)']} style={styles.speedBadge}>
        <Text style={styles.speedTxt}>{currentWpm} WPM</Text>
      </LinearGradient>

      {phase === 'countdown' ? (
        <View style={styles.countdownWrap}>
          <Text style={styles.getReadyTxt}>Get ready to read...</Text>
          <Animated.Text style={[styles.countdownNum, { transform: [{ scale: countdownAnim }] }]}>
            {countdown}
          </Animated.Text>
          <Text style={styles.countdownHint}>Words will flash one at a time</Text>
        </View>
      ) : phase === 'reading' ? (
        <View style={styles.readingWrap}>
          <Text style={styles.readingHint}>FOCUS ON THE WORD</Text>
          <LinearGradient colors={['rgba(255,107,53,0.1)', 'rgba(255,107,53,0.03)']} style={styles.wordWindow}>
            <Animated.Text
              style={[styles.currentWord, {
                opacity: wordAnim,
                transform: [{ scale: wordAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
              }]}
            >
              {currentWordIdx < passage.words.length ? passage.words[currentWordIdx] : ''}
            </Animated.Text>
          </LinearGradient>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#FF6B35', '#FF8F60']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${(currentWordIdx / passage.words.length) * 100}%` }]}
            />
          </View>
          <Text style={styles.wordCount}>{currentWordIdx} / {passage.words.length} words</Text>
        </View>
      ) : (
        <View style={styles.questionWrap}>
          <Text style={styles.qLabel}>COMPREHENSION CHECK</Text>
          <Text style={styles.qText}>{passage.question}</Text>
          <View style={styles.optionsWrap}>
            {passage.options.map((option, idx) => {
              let borderColor = 'rgba(255,107,53,0.15)';
              let bgColors: [string, string] = ['rgba(255,107,53,0.06)', 'rgba(255,107,53,0.02)'];
              if (selected !== null) {
                if (idx === passage.answer) { borderColor = '#22C55E'; bgColors = ['rgba(34,197,94,0.18)', 'rgba(34,197,94,0.06)']; }
                else if (idx === selected) { borderColor = '#EF4444'; bgColors = ['rgba(239,68,68,0.18)', 'rgba(239,68,68,0.06)']; }
              }
              return (
                <TouchableOpacity key={idx} onPress={() => handleAnswer(idx)} disabled={selected !== null} activeOpacity={0.7}>
                  <LinearGradient colors={bgColors} style={[styles.optBtn, { borderColor }]}>
                    <LinearGradient colors={['rgba(255,107,53,0.2)', 'rgba(255,107,53,0.08)']} style={styles.optLetter}>
                      <Text style={styles.optLetterTxt}>{String.fromCharCode(65 + idx)}</Text>
                    </LinearGradient>
                    <Text style={[styles.optText,
                      selected !== null && idx === passage.answer && { color: '#22C55E' },
                      selected !== null && idx === selected && idx !== passage.answer && { color: '#EF4444' },
                    ]}>{option}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  pips: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 12 },
  pip: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,107,53,0.12)' },
  pipDone: { backgroundColor: '#FF6B35' },
  pipActive: { backgroundColor: '#FF6B35' },
  speedBadge: {
    alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.15)', marginBottom: 24,
  },
  speedTxt: { fontSize: 12, fontFamily: FontFamily.bold, color: '#FF6B35', letterSpacing: 1.5 },
  countdownWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  getReadyTxt: { fontSize: 18, fontFamily: FontFamily.semibold, color: 'rgba(255,238,230,0.6)', marginBottom: 32 },
  countdownNum: { fontSize: 80, fontFamily: FontFamily.bold, color: '#FF6B35', marginBottom: 32 },
  countdownHint: { fontSize: 14, fontFamily: FontFamily.medium, color: 'rgba(255,238,230,0.3)' },
  readingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  readingHint: { fontSize: 11, color: 'rgba(255,238,230,0.35)', marginBottom: 24, letterSpacing: 2.5, fontFamily: FontFamily.bold },
  wordWindow: {
    width: '100%', height: 120, justifyContent: 'center', alignItems: 'center',
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,107,53,0.1)', marginBottom: 28,
  },
  currentWord: {
    fontSize: 44, fontFamily: FontFamily.bold, color: '#FFEEE6',
    textShadowColor: 'rgba(255,107,53,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18,
  },
  progressBar: { width: '80%', height: 4, backgroundColor: 'rgba(255,107,53,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 2 },
  wordCount: { fontSize: 12, color: 'rgba(255,238,230,0.35)', fontFamily: FontFamily.medium },
  questionWrap: { flex: 1, justifyContent: 'center' },
  qLabel: { fontSize: 10, fontFamily: FontFamily.bold, color: '#FF6B35', letterSpacing: 2, textAlign: 'center', marginBottom: 12 },
  qText: { fontSize: 20, fontFamily: FontFamily.bold, color: '#FFEEE6', textAlign: 'center', marginBottom: 28, lineHeight: 28 },
  optionsWrap: { gap: 12 },
  optBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 15, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1,
  },
  optLetter: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  optLetterTxt: { fontSize: 12, fontFamily: FontFamily.bold, color: '#FF6B35' },
  optText: { fontSize: 15, fontFamily: FontFamily.semibold, color: '#FFEEE6', flex: 1 },
});
