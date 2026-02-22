import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';

export interface GameTheme {
  gradient: [string, string, string];
  accent: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  cardBorder: string;
  timerBg: string;
  timerFill: string;
  timerLow: string;
}

export const GAME_THEMES: Record<string, GameTheme> = {
  math: {
    gradient: ['#0D0221', '#1A0533', '#2D1B69'],
    accent: '#00F0FF',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
    cardBg: 'rgba(0,240,255,0.08)',
    cardBorder: 'rgba(0,240,255,0.2)',
    timerBg: 'rgba(255,255,255,0.1)',
    timerFill: '#00F0FF',
    timerLow: '#FF3366',
  },
  memory: {
    gradient: ['#020B2E', '#0A1628', '#0F2847'],
    accent: '#00D4AA',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
    cardBg: 'rgba(0,212,170,0.08)',
    cardBorder: 'rgba(0,212,170,0.2)',
    timerBg: 'rgba(255,255,255,0.1)',
    timerFill: '#00D4AA',
    timerLow: '#FF6B6B',
  },
  pattern: {
    gradient: ['#0A0E27', '#1B0F3A', '#0F2027'],
    accent: '#7B61FF',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
    cardBg: 'rgba(123,97,255,0.08)',
    cardBorder: 'rgba(123,97,255,0.2)',
    timerBg: 'rgba(255,255,255,0.1)',
    timerFill: '#7B61FF',
    timerLow: '#FF4D6D',
  },
  wordscramble: {
    gradient: ['#1A1207', '#2D1F0E', '#3D2B14'],
    accent: '#E8B84B',
    textPrimary: '#FFF8E7',
    textSecondary: 'rgba(255,248,231,0.6)',
    cardBg: 'rgba(232,184,75,0.08)',
    cardBorder: 'rgba(232,184,75,0.2)',
    timerBg: 'rgba(255,255,255,0.1)',
    timerFill: '#E8B84B',
    timerLow: '#E85D4B',
  },
  speedread: {
    gradient: ['#1A0A0A', '#2D0F0F', '#3D1414'],
    accent: '#FF6B35',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
    cardBg: 'rgba(255,107,53,0.08)',
    cardBorder: 'rgba(255,107,53,0.2)',
    timerBg: 'rgba(255,255,255,0.1)',
    timerFill: '#FF6B35',
    timerLow: '#FF3333',
  },
  reaction: {
    gradient: ['#0A0A1A', '#141433', '#1E1E4D'],
    accent: '#FFD600',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
    cardBg: 'rgba(255,214,0,0.08)',
    cardBorder: 'rgba(255,214,0,0.2)',
    timerBg: 'rgba(255,255,255,0.1)',
    timerFill: '#FFD600',
    timerLow: '#FF4444',
  },
  colormatch: {
    gradient: ['#1A0A2E', '#2D1052', '#3F1676'],
    accent: '#FF69B4',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
    cardBg: 'rgba(255,105,180,0.08)',
    cardBorder: 'rgba(255,105,180,0.2)',
    timerBg: 'rgba(255,255,255,0.1)',
    timerFill: '#FF69B4',
    timerLow: '#FF4444',
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
}

export default function GameShell({ title, color, score, timeLeft, maxTime = 30, children, onClose, gameId }: GameShellProps) {
  const theme = GAME_THEMES[gameId || ''] || GAME_THEMES.math;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scoreAnim = useRef(new Animated.Value(1)).current;
  const prevScore = useRef(score);

  useEffect(() => {
    if (score !== prevScore.current) {
      prevScore.current = score;
      Animated.sequence([
        Animated.timing(scoreAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
        Animated.timing(scoreAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [score]);

  useEffect(() => {
    if (timeLeft !== undefined && timeLeft <= 5 && timeLeft > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [timeLeft]);

  const timerPercent = timeLeft !== undefined ? Math.max(0, (timeLeft / maxTime) * 100) : 0;
  const isLow = timeLeft !== undefined && timeLeft <= 10;

  return (
    <LinearGradient colors={theme.gradient} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            onPress={onClose ?? (() => router.back())}
          >
            <X size={16} color={theme.textSecondary} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{title}</Text>

          <Animated.View
            style={[
              styles.scoreContainer,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
              { transform: [{ scale: scoreAnim }] },
            ]}
          >
            <Text style={[styles.scoreValue, { color: theme.accent }]}>{score}</Text>
            <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>pts</Text>
          </Animated.View>
        </View>

        {timeLeft !== undefined && (
          <Animated.View style={[styles.timerBar, { backgroundColor: theme.timerBg, transform: [{ scaleX: pulseAnim }] }]}>
            <View
              style={[
                styles.timerFill,
                {
                  width: `${timerPercent}%`,
                  backgroundColor: isLow ? theme.timerLow : theme.timerFill,
                },
              ]}
            />
          </Animated.View>
        )}

        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 2,
  },
  scoreValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  timerBar: {
    height: 4,
    marginHorizontal: Spacing.xl,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
});
