import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';
import { GAME_THEMES, GameTheme } from './GameShell';

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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={theme.gradient} style={styles.container}>
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
        <View style={styles.resultIcon}>
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
          {isGood ? 'Well Done' : 'Keep Going'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{gameTitle}</Text>

        <View style={[styles.statsRow, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
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
            colors={[theme.accent, theme.accent + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Play Again</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  resultAnimation: {
    width: 80,
    height: 80,
  },
  resultDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    marginBottom: Spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: '100%',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  divider: {
    width: 1,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  buttonWrapper: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  primaryButton: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
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
    fontWeight: FontWeight.semibold,
  },
});
