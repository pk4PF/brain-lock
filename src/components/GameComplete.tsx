import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { Spacing, FontSize, FontFamily, BorderRadius } from '../constants/theme';
import { soundComplete, soundFail } from '../utils/sounds';
import { GAME_THEMES } from './GameShell';
import { useStore } from '../store/useStore';
import { GameType } from '../constants/games';

interface GameCompleteProps {
  score: number;
  correct: number;
  total: number;
  gameTitle: string;
  onPlayAgain: () => void;
  gameId?: string;
}

export default function GameComplete({ score, correct, total, gameTitle, onPlayAgain, gameId }: GameCompleteProps) {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isGood = percentage >= 70;
  const theme = GAME_THEMES[gameId || ''] || GAME_THEMES.math;

  const { progress, dailyGamesCompleted, settings } = useStore();
  const gameStats = gameId ? progress.gameStats[gameId as GameType] : null;
  const isNewBest = gameStats && score > 0 && gameStats.played <= 1;
  const hasGamesRemaining = dailyGamesCompleted < settings.challengesRequired;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isGood) {
      soundComplete();
    } else {
      soundFail();
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={theme.gradient} style={styles.container}>
      {/* Ambient orbs */}
      <View style={[styles.orb, { backgroundColor: theme.orbColors[0], top: -40, right: -60, width: 240, height: 240 }]} />
      <View style={[styles.orb, { backgroundColor: theme.orbColors[1], bottom: 80, left: -50, width: 200, height: 200 }]} />

      {isGood && (
        <LottieView
          source={require('../../assets/animations/confetti.json')}
          autoPlay
          loop={false}
          speed={0.8}
          style={styles.confettiOverlay}
        />
      )}

      <Animated.View
        style={[
          styles.card,
          { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.resultIcon, { backgroundColor: `${theme.accent}10` }]}>
          {isGood ? (
            <LottieView
              source={require('../../assets/animations/success.json')}
              autoPlay
              loop={false}
              style={styles.resultAnimation}
            />
          ) : (
            <View style={[styles.resultDot, { backgroundColor: theme.textSecondary }]} />
          )}
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {isGood ? 'Well Done!' : correct > 0 ? 'Nice Try!' : 'Keep Going'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {isGood
            ? gameTitle
            : `You got ${correct} right${total - correct <= 2 ? ' — so close!' : '. Keep practicing!'}`}
        </Text>

        {isNewBest && score > 0 && (
          <View style={[styles.bestBadge, { backgroundColor: `${theme.accent}15` }]}>
            <Text style={[styles.bestBadgeText, { color: theme.accent }]}>New Personal Best!</Text>
          </View>
        )}

        <View style={[styles.statsRow, { backgroundColor: `${theme.accent}08` }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.accent }]}>{score}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Credits</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{correct}/{total}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Correct</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: isGood ? '#22C55E' : theme.textPrimary }]}>{percentage}%</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Accuracy</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
        <TouchableOpacity activeOpacity={0.8} onPress={onPlayAgain} style={styles.buttonWrapper}>
          <LinearGradient
            colors={[theme.accent, `${theme.accent}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Play Again</Text>
          </LinearGradient>
        </TouchableOpacity>

        {hasGamesRemaining && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.replace('/(tabs)/games')}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={[`${theme.accent}30`, `${theme.accent}15`]}
              style={styles.primaryButton}
            >
              <Text style={[styles.primaryButtonText, { color: theme.textPrimary }]}>
                Next Game ({settings.challengesRequired - dailyGamesCompleted} left)
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace('/(tabs)')}
          style={[styles.secondaryButton, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  orb: { position: 'absolute', borderRadius: 999 },
  card: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: Spacing.xxl,
  },
  confettiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'none',
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  resultAnimation: { width: 80, height: 80 },
  resultDot: { width: 24, height: 24, borderRadius: 12 },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  bestBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  bestBadgeText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: '100%',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FontSize.xl, fontFamily: FontFamily.bold },
  statLabel: { fontSize: FontSize.sm, fontFamily: FontFamily.medium, marginTop: 2 },
  divider: { width: 1 },
  actions: { width: '100%', gap: Spacing.md },
  buttonWrapper: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  primaryButton: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
  },
  secondaryButton: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
  },
});
