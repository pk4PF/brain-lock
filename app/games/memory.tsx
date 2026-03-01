import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import GameShell, { GAME_THEMES } from '../../src/components/GameShell';
import GameComplete from '../../src/components/GameComplete';
import { soundTap, soundCorrect, soundWrong, soundRound } from '../../src/utils/sounds';

const T = GAME_THEMES.memory;

const PALETTE = [
  { color: '#00D4AA', glow: 'rgba(0,212,170,0.35)' },
  { color: '#00B4D8', glow: 'rgba(0,180,216,0.35)' },
  { color: '#7B61FF', glow: 'rgba(123,97,255,0.35)' },
  { color: '#FF6B6B', glow: 'rgba(255,107,107,0.35)' },
  { color: '#FFD93D', glow: 'rgba(255,217,61,0.35)' },
  { color: '#FF69B4', glow: 'rgba(255,105,180,0.35)' },
];

type Phase = 'showing' | 'input' | 'feedback';

const MULT_STAGES = [1, 1, 1.2, 1.5, 1.5, 1.8, 2, 2];

export default function MemoryGame() {
  const { addPoints, recordGame, completeDailyGame } = useStore();
  const startLength = 4;

  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('showing');
  const [showingIndex, setShowingIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [flashIdx, setFlashIdx] = useState(-1);
  const startTime = useRef(Date.now());
  const scaleAnims = useRef(PALETTE.map(() => new Animated.Value(1))).current;

  const generateSequence = useCallback((length: number) => {
    const seq: number[] = [];
    for (let i = 0; i < length; i++) seq.push(Math.floor(Math.random() * PALETTE.length));
    return seq;
  }, []);

  const showSequence = useCallback((seq: number[]) => {
    setPhase('showing');
    setShowingIndex(-1);
    setFlashIdx(-1);
    const speed = 600;
    seq.forEach((colorIdx, idx) => {
      setTimeout(() => {
        setShowingIndex(idx);
        setFlashIdx(colorIdx);
        Animated.sequence([
          Animated.timing(scaleAnims[colorIdx], { toValue: 1.08, duration: 150, useNativeDriver: true }),
          Animated.timing(scaleAnims[colorIdx], { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
      }, (idx + 1) * speed);
      setTimeout(() => {
        setFlashIdx(-1);
      }, (idx + 1) * speed + 400);
    });
    setTimeout(() => { setShowingIndex(-1); setFlashIdx(-1); setPhase('input'); }, (seq.length + 1) * speed);
  }, []);

  useEffect(() => {
    const seq = generateSequence(startLength);
    setSequence(seq);
    showSequence(seq);
  }, []);

  const handleTap = (colorIdx: number) => {
    if (phase !== 'input') return;
    soundTap();

    // Flash the tapped tile
    setFlashIdx(colorIdx);
    Animated.sequence([
      Animated.timing(scaleAnims[colorIdx], { toValue: 1.1, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnims[colorIdx], { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setFlashIdx(-1), 250);

    const newInput = [...playerInput, colorIdx];
    setPlayerInput(newInput);
    const currentPos = newInput.length - 1;

    if (newInput[currentPos] !== sequence[currentPos]) {
      soundWrong();
      setPhase('feedback');
      setTotalAttempts((t) => t + 1);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) { finishGame(correct, score); }
      else { setTimeout(() => { setPlayerInput([]); showSequence(sequence); }, 800); }
      return;
    }

    if (newInput.length === sequence.length) {
      soundCorrect();
      const mult = MULT_STAGES[Math.min(correct, MULT_STAGES.length - 1)];
      const points = Math.round(sequence.length * 5 * mult);
      const newScore = score + points;
      const newCorrect = correct + 1;
      setScore(newScore);
      setCorrect(newCorrect);
      setTotalAttempts((t) => t + 1);
      setLevel((l) => l + 1);
      setPhase('feedback');
      setTimeout(() => {
        soundRound();
        const newSeq = generateSequence(startLength + newCorrect);
        setSequence(newSeq);
        setPlayerInput([]);
        showSequence(newSeq);
      }, 800);
    }
  };

  const finishGame = (finalCorrect: number, finalScore: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    addPoints(finalScore);
    const won = finalCorrect >= 3;
    recordGame('memory', won, timeTaken);
    completeDailyGame();
    setGameOver(true);
  };

  const resetGame = () => {
    setScore(0); setLevel(1); setCorrect(0); setTotalAttempts(0);
    setLives(3); setGameOver(false); setPlayerInput([]); setFlashIdx(-1);
    const seq = generateSequence(startLength);
    setSequence(seq);
    showSequence(seq);
  };

  if (gameOver) {
    return <GameComplete score={score} correct={correct} total={totalAttempts} gameTitle="Memory Sequence" onPlayAgain={resetGame} gameId="memory" />;
  }

  return (
    <GameShell title="Memory Sequence" color="#00D4AA" score={score} gameId="memory" multiplier={MULT_STAGES[Math.min(correct, MULT_STAGES.length - 1)]}>
      {/* Level badge */}
      <View style={styles.statusRow}>
        <LinearGradient colors={['rgba(0,212,170,0.12)', 'rgba(0,212,170,0.04)']} style={styles.levelBadge}>
          <Text style={styles.levelLbl}>LEVEL</Text>
          <Text style={styles.levelVal}>{level}</Text>
        </LinearGradient>
      </View>

      {/* Phase text */}
      <View style={styles.phaseWrap}>
        <Text style={styles.phaseTxt}>
          {phase === 'showing' ? 'Watch the pattern...'
            : phase === 'input' ? `Tap ${sequence.length - playerInput.length} more`
            : correct > 0 ? 'Nice! Next round...' : 'Try again...'}
        </Text>
      </View>

      {/* Color buttons */}
      <View style={styles.colorsGrid}>
        {PALETTE.map((item, idx) => {
          const isLit = flashIdx === idx;
          return (
            <TouchableOpacity
              key={idx}
              style={styles.colorBtn}
              onPress={() => handleTap(idx)}
              activeOpacity={0.85}
              disabled={phase !== 'input'}
            >
              <Animated.View style={[styles.colorInner, { transform: [{ scale: scaleAnims[idx] }] }]}>
                <LinearGradient
                  colors={isLit ? ['#FFFFFF', item.color] : [item.color, `${item.color}BB`]}
                  style={[
                    styles.colorGrad,
                    isLit && { shadowColor: item.color, shadowOpacity: 0.9, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } },
                    { opacity: isLit ? 1 : phase === 'input' ? 0.75 : phase === 'showing' ? 0.35 : 0.5 },
                  ]}
                />
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 16 },
  levelBadge: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(0,212,170,0.15)',
  },
  levelLbl: { fontSize: 10, fontFamily: FontFamily.bold, color: 'rgba(0,212,170,0.6)', letterSpacing: 1 },
  levelVal: { fontSize: 20, fontFamily: FontFamily.bold, color: '#00D4AA' },
  phaseWrap: { alignItems: 'center', marginBottom: 24 },
  phaseTxt: { fontSize: 15, color: 'rgba(224,255,245,0.5)', fontFamily: FontFamily.semibold },
  colorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
  colorBtn: { width: '29%', aspectRatio: 1, borderRadius: 22, overflow: 'hidden' },
  colorInner: { flex: 1 },
  colorGrad: { flex: 1, borderRadius: 22 },
});
