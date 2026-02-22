import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { DIFFICULTY_CONFIG } from '../../src/constants/games';
import GameShell, { GAME_THEMES } from '../../src/components/GameShell';
import GameComplete from '../../src/components/GameComplete';

const theme = GAME_THEMES.reaction;

type Phase = 'waiting' | 'ready' | 'go' | 'result' | 'tooEarly';

const TOTAL_ROUNDS = 8;

export default function ReactionGame() {
  const { settings, addPoints, recordGame } = useStore();
  const difficulty = settings.difficulty;
  const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;

  const targetTime = difficulty === 'easy' ? 500 : difficulty === 'medium' ? 350 : 200;

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

  const startRound = useCallback(() => {
    setPhase('ready');
    ringAnim.setValue(0);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    const delay = 1500 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      goTime.current = Date.now();
      setPhase('go');
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      Animated.timing(ringAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, delay);
  }, []);

  const handleTap = () => {
    if (phase === 'waiting') {
      startRound();
      return;
    }

    if (phase === 'ready') {
      clearTimeout(timerRef.current);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      setPhase('tooEarly');
      return;
    }

    if (phase === 'go') {
      const rt = Date.now() - goTime.current;
      setReactionTime(rt);

      const newTimes = [...times, rt];
      setTimes(newTimes);

      if (rt < bestTime) setBestTime(rt);

      let newScore = score;
      let newCorrect = correct;

      if (rt <= targetTime + 200) {
        const bonus = Math.max(0, targetTime + 200 - rt);
        const points = Math.round((10 + bonus / 20) * multiplier);
        newScore = score + points;
        newCorrect = correct + 1;
        setScore(newScore);
        setCorrect(newCorrect);
      }

      setPhase('result');

      if (round >= TOTAL_ROUNDS) {
        setTimeout(() => finishGame(newCorrect, newScore), 1200);
      }
      return;
    }

    if (phase === 'result' || phase === 'tooEarly') {
      if (round >= TOTAL_ROUNDS) {
        finishGame(correct, score);
      } else {
        setRound((r) => r + 1);
        setPhase('waiting');
      }
    }
  };

  const finishGame = (finalCorrect: number, finalScore: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    addPoints(finalScore);
    recordGame('reaction', finalCorrect >= TOTAL_ROUNDS * 0.5, timeTaken);
    setGameOver(true);
  };

  const resetGame = () => {
    setScore(0);
    setRound(1);
    setCorrect(0);
    setReactionTime(0);
    setBestTime(9999);
    setGameOver(false);
    setTimes([]);
    setPhase('waiting');
  };

  if (gameOver) {
    return (
      <GameComplete
        score={score}
        correct={correct}
        total={TOTAL_ROUNDS}
        gameTitle="Reaction Time"
        onPlayAgain={resetGame}
        gameId="reaction"
      />
    );
  }

  const getPhaseColor = () => {
    switch (phase) {
      case 'ready': return '#FF4444';
      case 'go': return '#FFD600';
      case 'tooEarly': return '#FF4444';
      case 'result': return reactionTime <= targetTime ? '#22C55E' : '#FFD600';
      default: return 'rgba(255,214,0,0.3)';
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'waiting': return 'Tap to Start';
      case 'ready': return 'Wait...';
      case 'go': return 'TAP NOW!';
      case 'tooEarly': return 'Too Early!';
      case 'result': return `${reactionTime}ms`;
      default: return '';
    }
  };

  const getSubText = () => {
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
  };

  return (
    <GameShell title="Reaction Time" color="#FFD600" score={score} gameId="reaction">
      <View style={styles.roundRow}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.roundDot,
              i < round - 1 && { backgroundColor: '#FFD600' },
              i === round - 1 && { backgroundColor: '#FFD600', width: 16 },
            ]}
          />
        ))}
      </View>

      {bestTime < 9999 && (
        <View style={styles.bestTimeBadge}>
          <Text style={styles.bestTimeLabel}>BEST</Text>
          <Text style={styles.bestTimeValue}>{bestTime}ms</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.tapArea}
        onPress={handleTap}
        activeOpacity={0.9}
      >
        <Animated.View
          style={[
            styles.circle,
            {
              borderColor: getPhaseColor(),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.circleInner,
              {
                backgroundColor: getPhaseColor(),
                opacity: phase === 'go' ? ringAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }) : phase === 'result' || phase === 'tooEarly' ? 0.8 : 0.15,
              },
            ]}
          />

          <Text style={[styles.phaseText, { color: phase === 'go' ? '#0A0A1A' : '#FFFFFF' }]}>
            {getPhaseText()}
          </Text>
        </Animated.View>

        <Text style={styles.subText}>{getSubText()}</Text>

        {phase === 'result' && (
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Target: under {targetTime + 200}ms</Text>
          </View>
        )}
      </TouchableOpacity>

      {times.length > 0 && (
        <View style={styles.historyRow}>
          {times.slice(-5).map((t, i) => (
            <View
              key={i}
              style={[
                styles.historyDot,
                { backgroundColor: t <= targetTime + 200 ? '#22C55E' : '#FF4444' },
              ]}
            >
              <Text style={styles.historyText}>{t}</Text>
            </View>
          ))}
        </View>
      )}
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
  roundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  bestTimeBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    backgroundColor: 'rgba(255,214,0,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.2)',
    marginBottom: Spacing.lg,
  },
  bestTimeLabel: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,214,0,0.6)',
    letterSpacing: 1,
  },
  bestTimeValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#FFD600',
  },
  tapArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    overflow: 'hidden',
  },
  circleInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 100,
  },
  phaseText: {
    fontSize: 32,
    fontWeight: FontWeight.heavy,
    letterSpacing: 1,
    zIndex: 1,
  },
  subText: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: FontWeight.semibold,
  },
  targetRow: {
    marginTop: Spacing.md,
  },
  targetLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,214,0,0.5)',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  historyDot: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  historyText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
});
