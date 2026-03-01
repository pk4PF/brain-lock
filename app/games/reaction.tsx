import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import GameShell, { GAME_THEMES } from '../../src/components/GameShell';
import GameComplete from '../../src/components/GameComplete';
import { soundTap, soundCorrect, soundWrong, soundRound } from '../../src/utils/sounds';

const T = GAME_THEMES.reaction;
type Phase = 'waiting' | 'ready' | 'go' | 'result' | 'tooEarly';
const TOTAL_ROUNDS = 8;

// Target time tightens each round (ms) — you need to be under target+200 to score
const TARGET_STAGES = [500, 450, 400, 350, 300, 280, 250, 220];
const MULT_STAGES = [1, 1, 1.2, 1.2, 1.5, 1.5, 1.8, 2];
// Wait delay gets more unpredictable in later rounds
const MIN_DELAY = [1500, 1500, 1200, 1200, 1000, 1000, 800, 800];
const MAX_DELAY = [3000, 3000, 3500, 3500, 4000, 4000, 4500, 5000];

export default function ReactionGame() {
  const { addPoints, recordGame, completeDailyGame } = useStore();

  const [phase, setPhase] = useState<Phase>('waiting');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [bestTime, setBestTime] = useState(9999);
  const [gameOver, setGameOver] = useState(false);
  const [times, setTimes] = useState<number[]>([]);

  const goTime = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const startTime = useRef(Date.now());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const roundRef = useRef(round);
  roundRef.current = round;

  const getTargetTime = (r: number) => TARGET_STAGES[Math.min(r - 1, TARGET_STAGES.length - 1)];
  const targetTime = getTargetTime(round);

  const startRound = useCallback(() => {
    setPhase('ready');
    ringAnim.setValue(0);
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
    const r = roundRef.current;
    const minD = MIN_DELAY[Math.min(r - 1, MIN_DELAY.length - 1)];
    const maxD = MAX_DELAY[Math.min(r - 1, MAX_DELAY.length - 1)];
    const delay = minD + Math.random() * (maxD - minD);
    timerRef.current = setTimeout(() => {
      goTime.current = Date.now(); setPhase('go');
      pulseAnim.stopAnimation(); pulseAnim.setValue(1);
      Animated.timing(ringAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, delay);
  }, []);

  const handleTap = () => {
    if (phase === 'waiting') { startRound(); return; }
    if (phase === 'ready') {
      soundWrong();
      clearTimeout(timerRef.current); pulseAnim.stopAnimation(); pulseAnim.setValue(1);
      setPhase('tooEarly'); return;
    }
    if (phase === 'go') {
      soundTap();
      const rt = Date.now() - goTime.current;
      setReactionTime(rt);
      const newTimes = [...times, rt]; setTimes(newTimes);
      if (rt < bestTime) setBestTime(rt);
      let newScore = score; let newCorrect = correct;
      const curTarget = getTargetTime(round);
      if (rt <= curTarget + 200) {
        soundCorrect();
        const bonus = Math.max(0, curTarget + 200 - rt);
        const mult = MULT_STAGES[Math.min(round - 1, MULT_STAGES.length - 1)];
        const points = Math.round((10 + bonus / 20) * mult);
        newScore = score + points; newCorrect = correct + 1;
        setScore(newScore); setCorrect(newCorrect);
      }
      setPhase('result');
      if (round >= TOTAL_ROUNDS) setTimeout(() => finishGame(newCorrect, newScore), 1200);
      return;
    }
    if (phase === 'result' || phase === 'tooEarly') {
      if (round >= TOTAL_ROUNDS) finishGame(correct, score);
      else { soundRound(); setRound((r) => r + 1); setPhase('waiting'); }
    }
  };

  const finishGame = (finalCorrect: number, finalScore: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    addPoints(finalScore);
    const won = finalCorrect >= TOTAL_ROUNDS * 0.5;
    recordGame('reaction', won, timeTaken);
    completeDailyGame();
    setGameOver(true);
  };

  const resetGame = () => {
    setScore(0); setRound(1); setCorrect(0); setReactionTime(0);
    setBestTime(9999); setGameOver(false); setTimes([]); setPhase('waiting');
  };

  if (gameOver) {
    return <GameComplete score={score} correct={correct} total={TOTAL_ROUNDS} gameTitle="Reaction Time" onPlayAgain={resetGame} gameId="reaction" />;
  }

  const phaseColor = (() => {
    switch (phase) {
      case 'ready': return '#FF4444';
      case 'go': return '#FFD600';
      case 'tooEarly': return '#FF4444';
      case 'result': return reactionTime <= targetTime ? '#22C55E' : '#FFD600';
      default: return 'rgba(255,214,0,0.3)';
    }
  })();

  const phaseText = (() => {
    switch (phase) {
      case 'waiting': return 'Tap to Start';
      case 'ready': return 'Wait...';
      case 'go': return 'TAP NOW!';
      case 'tooEarly': return 'Too Early!';
      case 'result': return `${reactionTime}ms`;
      default: return '';
    }
  })();

  const subText = (() => {
    switch (phase) {
      case 'waiting': return 'Get ready for round ' + round;
      case 'ready': return 'Wait for the signal...';
      case 'go': return 'Quick! Tap anywhere!';
      case 'tooEarly': return 'Tap to try again';
      case 'result':
        if (reactionTime <= targetTime) return 'Lightning fast!';
        if (reactionTime <= targetTime + 200) return 'Good reaction!';
        return 'Keep practicing!';
      default: return '';
    }
  })();

  return (
    <GameShell title="Reaction Time" color="#FFD600" score={score} gameId="reaction" multiplier={MULT_STAGES[Math.min(round - 1, MULT_STAGES.length - 1)]}>
      {/* Round pips */}
      <View style={styles.pips}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View key={i} style={[styles.pip, i < round - 1 && styles.pipDone, i === round - 1 && styles.pipActive]} />
        ))}
      </View>

      {bestTime < 9999 && (
        <LinearGradient colors={['rgba(255,214,0,0.12)', 'rgba(255,214,0,0.04)']} style={styles.bestBadge}>
          <Text style={styles.bestLbl}>BEST</Text>
          <Text style={styles.bestVal}>{bestTime}ms</Text>
        </LinearGradient>
      )}

      <TouchableOpacity style={styles.tapArea} onPress={handleTap} activeOpacity={0.9}>
        <Animated.View style={[styles.circle, { borderColor: phaseColor, transform: [{ scale: pulseAnim }] }]}>
          <Animated.View
            style={[
              styles.circleInner,
              { backgroundColor: phaseColor },
              {
                opacity: phase === 'go'
                  ? ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] })
                  : phase === 'result' || phase === 'tooEarly' ? 0.8 : 0.12,
              },
            ]}
          />
          <Text style={[styles.phaseText, { color: phase === 'go' ? '#0A0A1A' : '#FFFCE6' }]}>
            {phaseText}
          </Text>
        </Animated.View>
        <Text style={styles.subText}>{subText}</Text>
        {phase === 'result' && (
          <View style={styles.targetRow}>
            <Text style={styles.targetLbl}>Target: under {targetTime + 200}ms</Text>
          </View>
        )}
      </TouchableOpacity>

      {times.length > 0 && (
        <View style={styles.historyRow}>
          {times.slice(-5).map((t, i) => (
            <LinearGradient
              key={i}
              colors={t <= getTargetTime(Math.min(i + 1, TOTAL_ROUNDS)) + 200
                ? ['rgba(34,197,94,0.2)', 'rgba(34,197,94,0.08)']
                : ['rgba(255,68,68,0.2)', 'rgba(255,68,68,0.08)']}
              style={styles.historyChip}
            >
              <Text style={[styles.historyTxt, { color: t <= getTargetTime(Math.min(i + 1, TOTAL_ROUNDS)) + 200 ? '#22C55E' : '#FF4444' }]}>{t}</Text>
            </LinearGradient>
          ))}
        </View>
      )}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  pips: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 12 },
  pip: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,214,0,0.12)' },
  pipDone: { backgroundColor: '#FFD600' },
  pipActive: { backgroundColor: '#FFD600' },
  bestBadge: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'baseline', gap: 6,
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,214,0,0.15)', marginBottom: 16,
  },
  bestLbl: { fontSize: 10, fontFamily: FontFamily.bold, color: 'rgba(255,214,0,0.5)', letterSpacing: 1 },
  bestVal: { fontSize: 16, fontFamily: FontFamily.bold, color: '#FFD600' },
  tapArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  circle: {
    width: 200, height: 200, borderRadius: 100, borderWidth: 3,
    justifyContent: 'center', alignItems: 'center', marginBottom: 28, overflow: 'hidden',
  },
  circleInner: { ...StyleSheet.absoluteFillObject, borderRadius: 100 },
  phaseText: { fontSize: 30, fontFamily: FontFamily.heavy, letterSpacing: 1, zIndex: 1 },
  subText: { fontSize: 15, color: 'rgba(255,252,230,0.45)', fontFamily: FontFamily.semibold },
  targetRow: { marginTop: 12 },
  targetLbl: { fontSize: 12, color: 'rgba(255,214,0,0.4)', fontFamily: FontFamily.medium },
  historyRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 16 },
  historyChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  historyTxt: { fontSize: 12, fontFamily: FontFamily.bold },
});
