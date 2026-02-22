import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { DIFFICULTY_CONFIG } from '../../src/constants/games';
import GameShell, { GAME_THEMES } from '../../src/components/GameShell';
import GameComplete from '../../src/components/GameComplete';

const theme = GAME_THEMES.memory;

const OCEAN_PALETTE = [
  { color: '#00D4AA', glow: 'rgba(0,212,170,0.3)', label: 'Jade' },
  { color: '#00B4D8', glow: 'rgba(0,180,216,0.3)', label: 'Wave' },
  { color: '#7B61FF', glow: 'rgba(123,97,255,0.3)', label: 'Abyss' },
  { color: '#FF6B6B', glow: 'rgba(255,107,107,0.3)', label: 'Coral' },
  { color: '#FFD93D', glow: 'rgba(255,217,61,0.3)', label: 'Sand' },
  { color: '#FF69B4', glow: 'rgba(255,105,180,0.3)', label: 'Pearl' },
];

type Phase = 'showing' | 'input' | 'feedback';

export default function MemoryGame() {
  const { settings, addPoints, recordGame } = useStore();
  const difficulty = settings.difficulty;
  const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;
  const startLength = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;

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
  const [lastTapped, setLastTapped] = useState(-1);
  const startTime = useRef(Date.now());

  const rippleAnims = useRef(OCEAN_PALETTE.map(() => new Animated.Value(0))).current;

  const generateSequence = useCallback((length: number) => {
    const seq: number[] = [];
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * OCEAN_PALETTE.length));
    }
    return seq;
  }, []);

  const showSequence = useCallback((seq: number[]) => {
    setPhase('showing');
    setShowingIndex(-1);
    const speed = 600;
    seq.forEach((colorIdx, idx) => {
      setTimeout(() => {
        setShowingIndex(idx);
        Animated.sequence([
          Animated.timing(rippleAnims[colorIdx], { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(rippleAnims[colorIdx], { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      }, (idx + 1) * speed);
    });
    setTimeout(() => {
      setShowingIndex(-1);
      setPhase('input');
    }, (seq.length + 1) * speed);
  }, []);

  useEffect(() => {
    const seq = generateSequence(startLength);
    setSequence(seq);
    showSequence(seq);
  }, []);

  const handleTap = (colorIdx: number) => {
    if (phase !== 'input') return;
    setLastTapped(colorIdx);

    Animated.sequence([
      Animated.timing(rippleAnims[colorIdx], { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(rippleAnims[colorIdx], { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const newInput = [...playerInput, colorIdx];
    setPlayerInput(newInput);
    const currentPos = newInput.length - 1;

    if (newInput[currentPos] !== sequence[currentPos]) {
      setPhase('feedback');
      setTotalAttempts((t) => t + 1);
      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        finishGame(correct, score);
      } else {
        setTimeout(() => {
          setPlayerInput([]);
          showSequence(sequence);
        }, 800);
      }
      return;
    }

    if (newInput.length === sequence.length) {
      const points = Math.round(sequence.length * 5 * multiplier);
      const newScore = score + points;
      const newCorrect = correct + 1;
      setScore(newScore);
      setCorrect(newCorrect);
      setTotalAttempts((t) => t + 1);
      setLevel((l) => l + 1);
      setPhase('feedback');

      setTimeout(() => {
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
    recordGame('memory', finalCorrect >= 3, timeTaken);
    setGameOver(true);
  };

  const resetGame = () => {
    setScore(0);
    setLevel(1);
    setCorrect(0);
    setTotalAttempts(0);
    setLives(3);
    setGameOver(false);
    setPlayerInput([]);
    const seq = generateSequence(startLength);
    setSequence(seq);
    showSequence(seq);
  };

  if (gameOver) {
    return (
      <GameComplete
        score={score}
        correct={correct}
        total={totalAttempts}
        gameTitle="Memory Sequence"
        onPlayAgain={resetGame}
        gameId="memory"
      />
    );
  }

  return (
    <GameShell title="Memory Sequence" color="#00D4AA" score={score} gameId="memory">
      <View style={styles.statusRow}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelLabel}>DEPTH</Text>
          <Text style={styles.levelText}>{level}</Text>
        </View>
        <View style={styles.livesRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.lifeBubble, i >= lives && styles.lifeBubbleEmpty]}>
              {i < lives && <View style={styles.lifeBubbleInner} />}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.phaseIndicator}>
        <Text style={styles.phaseText}>
          {phase === 'showing'
            ? 'Watch the pattern...'
            : phase === 'input'
            ? `Tap ${sequence.length - playerInput.length} more`
            : correct > 0 ? 'Diving deeper...' : 'Try again...'}
        </Text>
      </View>

      <View style={styles.sequencePreview}>
        {sequence.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.sequenceDot,
              idx < playerInput.length && {
                backgroundColor: playerInput[idx] === sequence[idx] ? '#00D4AA' : '#FF6B6B',
              },
              phase === 'showing' && idx === showingIndex && {
                backgroundColor: OCEAN_PALETTE[sequence[idx]].color,
                transform: [{ scale: 1.4 }],
                shadowColor: OCEAN_PALETTE[sequence[idx]].color,
                shadowOpacity: 0.6,
                shadowRadius: 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.colorsGrid}>
        {OCEAN_PALETTE.map((item, idx) => {
          const isHighlighted = phase === 'showing' && showingIndex >= 0 && sequence[showingIndex] === idx;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.colorButton,
                phase !== 'input' && styles.colorButtonDisabled,
              ]}
              onPress={() => handleTap(idx)}
              activeOpacity={0.7}
              disabled={phase !== 'input'}
            >
              <Animated.View
                style={[
                  styles.colorButtonInner,
                  { backgroundColor: item.color },
                  isHighlighted && {
                    shadowColor: item.color,
                    shadowOpacity: 0.8,
                    shadowRadius: 20,
                    transform: [{ scale: 1.08 }],
                  },
                  {
                    opacity: rippleAnims[idx].interpolate({
                      inputRange: [0, 1],
                      outputRange: [isHighlighted ? 1 : 0.7, 1],
                    }),
                  },
                ]}
              >
                <Text style={styles.colorLabel}>{item.label}</Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    backgroundColor: 'rgba(0,212,170,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.2)',
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: 'rgba(0,212,170,0.6)',
    letterSpacing: 1,
  },
  levelText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#00D4AA',
  },
  livesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  lifeBubble: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lifeBubbleEmpty: {
    borderColor: 'rgba(255,107,107,0.2)',
  },
  lifeBubbleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
  },
  phaseIndicator: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  phaseText: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: FontWeight.semibold,
  },
  sequencePreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.xl,
    flexWrap: 'wrap',
  },
  sequenceDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  colorButton: {
    width: '28%',
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  colorButtonInner: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
  colorButtonDisabled: {
    opacity: 0.5,
  },
  colorLabel: {
    color: '#FFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
