import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import { router } from 'expo-router';
import { Lightning, Eye, Trophy } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, GameAccents } from '../../src/constants/theme';
import {
  GameHeader, GameIntro, GameResult,
} from '../../src/components/games/GameLayout';
import { ReactionTestIll } from '../../src/components/games/GameIllustrations';

const ROUNDS = 5;
const MIN_WAIT_MS = 1500;
const MAX_WAIT_MS = 4000;

const HUE = GameAccents.reaction.hue;
const GREEN = '#22C55E';
const NEAR_BLACK = '#0E0D0C';
// HUE is the reaction game's accent (used by header chip, badges).
// GREEN/NEAR_BLACK drive the actual play-screen background flash.

function creditsForAvg(avgMs: number): number {
  // Performance-based 2-5 cells (Day-1 plan tier table).
  //   <250ms → 5,  250-300ms → 4,  300-400ms → 3,  ≥400ms → 2.
  if (avgMs < 250) return 5;
  if (avgMs < 300) return 4;
  if (avgMs < 400) return 3;
  return 2;
}

function label(avgMs: number): string {
  if (avgMs < 230) return 'Superhuman speed';
  if (avgMs < 300) return 'Lightning fast';
  if (avgMs < 400) return 'Sharp reflexes';
  if (avgMs < 550) return 'Solid effort';
  return 'Good start';
}

type State = 'intro' | 'waiting' | 'go' | 'too-early' | 'result';

export default function ReactionScreen() {
  const { colors } = useThemeColors();
  const { earnReward, completeDailyGame, canEarnToday, setShowPaywall, recordCognitiveScore, recordGame } = useStore();

  const [gameState, setGameState] = useState<State>('intro');
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [earnedCredits, setEarnedCredits] = useState(0);

  const goStartRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgAnim = useRef(new Animated.Value(0)).current; // 0 = waiting, 1 = go

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: gameState === 'go' ? 1 : 0,
      duration: gameState === 'go' ? 80 : 220,
      useNativeDriver: false,
    }).start();
  }, [gameState]);

  const startRound = useCallback((roundNum: number) => {
    setRound(roundNum);
    setGameState('waiting');
    const delay = MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS);
    timerRef.current = setTimeout(() => {
      goStartRef.current = Date.now();
      setGameState('go');
    }, delay);
  }, []);

  const handleStart = () => {
    if (!canEarnToday()) { setShowPaywall(true); return; }
    track(Events.GameStarted, { game: 'reaction' });
    setTimes([]);
    setEarnedCredits(0);
    startRound(1);
  };

  const handleTap = () => {
    if (gameState === 'waiting') {
      if (timerRef.current) clearTimeout(timerRef.current);
      hapticLight();
      setGameState('too-early');
      return;
    }
    if (gameState === 'go') {
      const reactionMs = Date.now() - goStartRef.current;
      hapticMedium();
      const newTimes = [...times, reactionMs];
      setTimes(newTimes);

      if (round >= ROUNDS) {
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        const credits = creditsForAvg(avg);
        // completeDailyGame internally calls earnReward - don't double-award.
        completeDailyGame(credits);
        // Speed map: 230ms = 100, 550ms+ = 0. Lower = sharper.
        const speedScore = Math.max(0, Math.min(100, 100 - (avg - 230) * (100 / 320)));
        recordCognitiveScore('speed', speedScore);
        // Lifetime tile-stat counter — drives "X played" on the games tab.
        recordGame('reaction', true, avg);
        setEarnedCredits(credits);
        track(Events.GameCompleted, { game: 'reaction', avg_ms: avg, credits });
        setGameState('result');
      } else {
        setGameState('waiting');
        setTimeout(() => startRound(round + 1), 800);
      }
      return;
    }
    if (gameState === 'too-early') {
      setTimeout(() => startRound(round), 400);
    }
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const avgMs = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [NEAR_BLACK, GREEN],
  });

  // ── INTRO ──
  if (gameState === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Reaction" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<ReactionTestIll size={88} />}
          title="Reaction Test"
          blurb="Tap the moment the screen turns green. Five rounds. We'll average your time."
          rules={['5 rounds', 'Wait for green', 'No early taps']}
          startLabel="Start"
          onStart={handleStart}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (gameState === 'result') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Reaction" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Trophy size={36} color={HUE} weight="duotone" duotoneColor={HUE} duotoneOpacity={0.32} />}
          title={label(avgMs)}
          bigStat={avgMs}
          bigStatSuffix="ms"
          subtitle={`Average over ${ROUNDS} rounds`}
          credits={earnedCredits}
          primaryLabel="Play again"
          onPrimary={handleStart}
          secondaryLabel="Back to home"
          onSecondary={() => router.replace('/(tabs)')}
        />
      </View>
    );
  }

  // ── GAME (waiting / go / too-early) ──
  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]}>
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
          {gameState === 'waiting' && (
            <View style={{ alignItems: 'center' }}>
              <View style={[s.iconWrap, { borderColor: 'rgba(255,255,255,0.16)' }]}>
                <Eye size={42} color="rgba(255,255,255,0.85)" weight="duotone" duotoneOpacity={0.3} />
              </View>
              <Text style={s.bigLabel}>Wait…</Text>
              <Text style={s.subLabel}>Don't tap yet</Text>
              <Text style={s.roundCount}>Round {Math.min(round, ROUNDS)} of {ROUNDS}</Text>
            </View>
          )}
          {gameState === 'go' && (
            <View style={{ alignItems: 'center' }}>
              <View style={[s.iconWrap, { borderColor: 'rgba(255,255,255,0.5)' }]}>
                <Lightning size={48} color="#FFFFFF" weight="fill" />
              </View>
              <Text style={[s.bigLabel, { fontSize: 56, letterSpacing: -1.5 }]}>TAP</Text>
            </View>
          )}
          {gameState === 'too-early' && (
            <View style={{ alignItems: 'center' }}>
              <View style={[s.iconWrap, { borderColor: 'rgba(255,255,255,0.16)' }]}>
                <Lightning size={42} color="rgba(255,255,255,0.6)" weight="duotone" duotoneOpacity={0.3} />
              </View>
              <Text style={s.bigLabel}>Too early</Text>
              <Text style={s.subLabel}>Tap to try again</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  iconWrap: {
    width: 88, height: 88, borderRadius: 999, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bigLabel: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontFamily: FontFamily.regular,
    marginTop: 6,
  },
  roundCount: {
    position: 'absolute',
    bottom: -120,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
