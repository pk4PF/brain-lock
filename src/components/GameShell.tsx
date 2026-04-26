import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Spacing, FontSize, FontWeight, FontFamily, BorderRadius } from '../constants/theme';
import { soundCountdown } from '../utils/sounds';

export interface GameTheme {
  gradient: [string, string, string];
  accent: string;
  accentSoft: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  cardBorder: string;
  timerBg: string;
  timerFill: string;
  timerLow: string;
  orbColors: [string, string, string];
}

export const GAME_THEMES: Record<string, GameTheme> = {
  math: {
    gradient: ['#050D1A', '#0A1929', '#0F2847'],
    accent: '#00F0FF',
    accentSoft: 'rgba(0,240,255,0.12)',
    textPrimary: '#E8F4FF',
    textSecondary: 'rgba(232,244,255,0.5)',
    cardBg: 'rgba(0,240,255,0.06)',
    cardBorder: 'rgba(0,240,255,0.12)',
    timerBg: 'rgba(0,240,255,0.08)',
    timerFill: '#00F0FF',
    timerLow: '#FF3366',
    orbColors: ['rgba(0,240,255,0.04)', 'rgba(0,180,216,0.03)', 'rgba(0,240,255,0.025)'],
  },
};

interface GameShellProps {
  title: string;
  color: string;
  score: number;
  timeLeft?: number;
  maxTime?: number;
  children: React.ReactNode;
  onClose?: () => void;
  gameId?: string;
  multiplier?: number;
}

interface FloatingPoint {
  id: number;
  value: number;
  anim: Animated.Value;
}

export default function GameShell({ title, color, score, timeLeft, maxTime = 30, children, onClose, gameId, multiplier = 1 }: GameShellProps) {
  const theme = GAME_THEMES[gameId || ''] || GAME_THEMES.math;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scoreAnim = useRef(new Animated.Value(1)).current;
  const prevScore = useRef(score);
  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>([]);
  const floatingIdRef = useRef(0);

  useEffect(() => {
    if (score !== prevScore.current) {
      const delta = score - prevScore.current;
      prevScore.current = score;

      // Bounce the score badge
      Animated.sequence([
        Animated.timing(scoreAnim, { toValue: 1.15, duration: 80, useNativeDriver: true }),
        Animated.spring(scoreAnim, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      ]).start();

      // Spawn floating point popup
      if (delta > 0) {
        const id = ++floatingIdRef.current;
        const anim = new Animated.Value(0);
        setFloatingPoints((prev) => [...prev, { id, value: delta, anim }]);

        Animated.timing(anim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }).start(() => {
          setFloatingPoints((prev) => prev.filter((p) => p.id !== id));
        });
      }
    }
  }, [score]);

  useEffect(() => {
    if (timeLeft !== undefined && timeLeft <= 3 && timeLeft > 0) {
      soundCountdown();
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 120, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    }
  }, [timeLeft]);

  const timerPercent = timeLeft !== undefined ? Math.max(0, (timeLeft / maxTime) * 100) : 0;
  const isLow = timeLeft !== undefined && timeLeft <= 10;

  return (
    <LinearGradient colors={theme.gradient} style={styles.container}>
      {/* Decorative ambient orbs for depth */}
      <View style={[styles.orb, styles.orbTR, { backgroundColor: theme.orbColors[0] }]} />
      <View style={[styles.orb, styles.orbBL, { backgroundColor: theme.orbColors[1] }]} />
      <View style={[styles.orb, styles.orbMR, { backgroundColor: theme.orbColors[2] }]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            onPress={onClose ?? (() => router.back())}
          >
            <ChevronLeft size={20} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{title}</Text>
          </View>

          <View style={styles.scoreArea}>
            <Animated.View
              style={[
                styles.scoreBadge,
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                { transform: [{ scale: scoreAnim }] },
              ]}
            >
              <Text style={[styles.scoreVal, { color: theme.accent }]}>{score}</Text>
              <Text style={[styles.scoreLbl, { color: theme.textSecondary }]}>pts</Text>
            </Animated.View>

            {/* Multiplier badge */}
            {multiplier > 1 && (
              <View style={[styles.multBadge, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.multText, { color: theme.accent }]}>{multiplier}x</Text>
              </View>
            )}

            {/* Floating point popups */}
            {floatingPoints.map((fp) => (
              <Animated.Text
                key={fp.id}
                style={[
                  styles.floatingPoint,
                  { color: theme.accent },
                  {
                    opacity: fp.anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
                    transform: [{
                      translateY: fp.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }),
                    }],
                  },
                ]}
              >
                +{fp.value}
              </Animated.Text>
            ))}
          </View>
        </View>

        {/* Timer bar */}
        {timeLeft !== undefined && (
          <View style={styles.timerWrap}>
            <Animated.View
              style={[styles.timerTrack, { backgroundColor: theme.timerBg, transform: [{ scaleX: pulseAnim }] }]}
            >
              <LinearGradient
                colors={isLow ? [theme.timerLow, '#FF6666'] : [theme.accent, theme.timerFill]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.timerFill, { width: `${timerPercent}%` }]}
              />
            </Animated.View>
            <Text style={[styles.timerNum, { color: isLow ? theme.timerLow : theme.textSecondary }]}>
              {timeLeft}s
            </Text>
          </View>
        )}

        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Ambient orbs
  orb: { position: 'absolute', borderRadius: 999 },
  orbTR: { width: 280, height: 280, top: -60, right: -80 },
  orbBL: { width: 220, height: 220, bottom: 60, left: -60 },
  orbMR: { width: 160, height: 160, top: '42%', right: -30 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 3,
  },
  scoreArea: { alignItems: 'center' },
  scoreVal: { fontSize: FontSize.xl, fontFamily: FontFamily.bold },
  scoreLbl: { fontSize: 10, fontFamily: FontFamily.semibold, letterSpacing: 0.5 },
  multBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  multText: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 0.3 },
  floatingPoint: {
    position: 'absolute',
    top: -8,
    right: -4,
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },

  // Timer
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 10,
    marginBottom: 4,
  },
  timerTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: 3 },
  timerNum: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    width: 28,
    textAlign: 'right',
  },

  // Content
  content: { flex: 1, padding: Spacing.xl },
});
