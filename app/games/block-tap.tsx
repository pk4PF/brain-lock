import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { Lightning } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { BlockTappingIll } from '../../src/components/games/GameIllustrations';

const HUE = GameAccents['block-tap'].hue;
const GRID = 4;            // 4x4 = 16 cells
const TOTAL_TARGETS = 15;  // tap this many to finish

type Phase = 'intro' | 'playing' | 'result';

function creditsForAvg(avgMs: number): number {
  if (avgMs < 600) return 5;
  if (avgMs < 800) return 4;
  if (avgMs < 1100) return 3;
  return 2;
}

/**
 * Quick Tap: a target appears in a random cell of a 4x4 grid; tap it and the
 * next one appears immediately. Track average tap time across 15 targets.
 * Tests visual scanning + raw motor speed - distinct from Reaction Test
 * (single stimulus, no spatial element).
 */
export default function BlockTapScreen() {
  const { colors } = useThemeColors();
  const { completeDailyGame, recordGame, recordCognitiveScore, canEarnToday, setShowPaywall } = useStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [targetIdx, setTargetIdx] = useState<number | null>(null);
  const [tapsDone, setTapsDone] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [earnedCredits, setEarnedCredits] = useState(0);

  const targetShownAt = useRef(0);
  const startTime = useRef(0);

  const placeNextTarget = useCallback((excludeIdx: number | null) => {
    let idx: number;
    do { idx = Math.floor(Math.random() * GRID * GRID); } while (idx === excludeIdx);
    setTargetIdx(idx);
    targetShownAt.current = Date.now();
  }, []);

  const startGame = () => {
    if (!canEarnToday()) { setShowPaywall(true); return; }
    track(Events.GameStarted, { game: 'block-tap' });
    setTapsDone(0);
    setTimes([]);
    startTime.current = Date.now();
    setPhase('playing');
    // Small delay so the user sees the grid before the first target.
    setTimeout(() => placeNextTarget(null), 400);
  };

  const handleCellPress = (idx: number) => {
    if (idx !== targetIdx || targetIdx === null) return;
    hapticLight();
    const elapsed = Date.now() - targetShownAt.current;
    const newTimes = [...times, elapsed];
    setTimes(newTimes);
    const newCount = tapsDone + 1;
    setTapsDone(newCount);
    if (newCount >= TOTAL_TARGETS) {
      finishGame(newTimes);
    } else {
      placeNextTarget(idx);
    }
  };

  const finishGame = (allTimes: number[]) => {
    const totalElapsed = (Date.now() - startTime.current) / 1000;
    const avg = Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length);
    const credits = creditsForAvg(avg);
    const won = avg < 1000;
    recordGame('block-tap', won, totalElapsed);
    completeDailyGame(credits);
    // Speed map: <500ms = 100, 1500ms = 0.
    const speedScore = Math.max(0, Math.min(100, 100 - (avg - 500) * (100 / 1000)));
    recordCognitiveScore('speed', speedScore);
    setEarnedCredits(credits);
    track(Events.GameCompleted, { game: 'block-tap', avg_ms: avg, credits });
    setPhase('result');
  };

  const goHome = () => router.replace('/(tabs)');

  const avgMs = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Quick Tap" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<BlockTappingIll size={88} />}
          title="Quick Tap"
          blurb={`Tap the highlighted square. Next one appears the moment you do. ${TOTAL_TARGETS} targets total.`}
          rules={['Visual scanning', `${TOTAL_TARGETS} targets`, 'Speed']}
          startLabel="Start"
          onStart={startGame}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Quick Tap" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Lightning size={36} color={HUE} weight="duotone" duotoneColor={HUE} duotoneOpacity={0.32} />}
          title={avgMs < 600 ? 'Lightning hands' : avgMs < 800 ? 'Sharp speed' : avgMs < 1100 ? 'Solid' : 'Keep training'}
          bigStat={avgMs}
          bigStatSuffix="ms"
          subtitle="Average per tap"
          credits={earnedCredits}
          primaryLabel="Done"
          onPrimary={goHome}
          secondaryLabel="Play again"
          onSecondary={startGame}
        />
      </View>
    );
  }

  // ── PLAYING ──
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader
        title="Quick Tap"
        hue={HUE}
        rightSlot={
          <Text style={{ color: colors.muted, fontFamily: FontFamily.medium, fontSize: 13 }}>
            {tapsDone} / {TOTAL_TARGETS}
          </Text>
        }
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl }}>
        <View style={styles.grid}>
          {Array.from({ length: GRID * GRID }).map((_, i) => {
            const isTarget = i === targetIdx;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => handleCellPress(i)}
                style={[
                  styles.cell,
                  {
                    backgroundColor: isTarget ? HUE : colors.card,
                    borderColor: isTarget ? HUE : colors.border,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const CELL_SIZE = 70;
const CELL_GAP = 8;

const styles = StyleSheet.create({
  grid: {
    width: CELL_SIZE * GRID + CELL_GAP * (GRID - 1),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 14,
    borderWidth: 1.5,
  },
});
