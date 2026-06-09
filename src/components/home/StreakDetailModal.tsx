import { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { X, Flame, Check } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FontFamily, Spacing } from '../../constants/theme';
import { hapticLight } from '../../utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Current streak count from progress.currentStreak */
  currentStreak: number;
  /** Best-ever streak from progress.longestStreak */
  longestStreak: number;
  /**
   * Per-day points for the current week, indexed Sun=0..Sat=6 to match
   * `new Date().getDay()` and the existing `progress.weeklyPoints` array.
   */
  weeklyPoints: number[];
}

// Display order is Mon-first (matches the competitor screenshot the user
// shared and the user's local week convention).
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_INDEX_FROM_MONDAY = [1, 2, 3, 4, 5, 6, 0]; // map column → Date.getDay()

/**
 * Streak detail sheet - shown when the streak chip on Home is tapped.
 *
 * Hybrid celebratory tone: today's circle pops with a spring scale, and
 * the streak number gets a soft accent glow. But copy stays Brainlock
 * voice - no "Amazing work! You're on fire!", no flame on every checkmark.
 * The flame icon is used once (next to the number), and the rest is
 * hairline circles with checkmarks.
 */
export default function StreakDetailModal({
  visible,
  onClose,
  currentStreak,
  longestStreak,
  weeklyPoints,
}: Props) {
  const { colors } = useThemeColors();
  const todayDow = new Date().getDay();

  // Animate the streak number in.
  const numberScale = useRef(new Animated.Value(0.6)).current;
  const numberOpacity = useRef(new Animated.Value(0)).current;
  const todayPop = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!visible) return;
    numberScale.setValue(0.6);
    numberOpacity.setValue(0);
    todayPop.setValue(0.6);
    Animated.parallel([
      Animated.spring(numberScale, {
        toValue: 1,
        friction: 5.5,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.timing(numberOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(todayPop, {
        toValue: 1,
        friction: 4.5,
        tension: 90,
        delay: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  const handleClose = () => {
    hapticLight();
    onClose();
  };

  const dayDone = (dow: number) => (weeklyPoints?.[dow] ?? 0) > 0;

  // On-brand encouragement that scales with streak length without flames or
  // exclamation theatre. Numbers > adjectives.
  const subtitle =
    currentStreak === 0
      ? 'Play one game today to start.'
      : currentStreak === 1
        ? 'Day one. Keep it tomorrow.'
        : `${currentStreak} days in a row. Don't break it.`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* Close */}
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <X size={20} color={colors.muted} strokeWidth={2.2} />
          </TouchableOpacity>

          {/* Big streak number with flame */}
          <View style={styles.numberRow}>
            <Animated.View
              style={{
                opacity: numberOpacity,
                transform: [{ scale: numberScale }],
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={[styles.bigNumber, { color: colors.accent }]}>
                {currentStreak}
              </Text>
              <Flame
                size={42}
                color={colors.accent}
                fill={currentStreak > 0 ? colors.accent : 'transparent'}
                strokeWidth={2.2}
                style={{ marginLeft: 8 }}
              />
            </Animated.View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>
            {currentStreak === 1 ? 'day streak' : 'day streak'}
          </Text>

          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {subtitle}
          </Text>

          {/* Weekly grid */}
          <View style={[styles.grid, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.gridLabels}>
              {DAY_LABELS.map((d, i) => {
                const isToday = DAY_INDEX_FROM_MONDAY[i] === todayDow;
                return (
                  <Text
                    key={i}
                    style={[
                      styles.dayLabel,
                      { color: isToday ? colors.accent : colors.muted },
                    ]}
                  >
                    {d}
                  </Text>
                );
              })}
            </View>
            <View style={styles.gridCircles}>
              {DAY_LABELS.map((_, i) => {
                const dow = DAY_INDEX_FROM_MONDAY[i];
                const done = dayDone(dow);
                const isToday = dow === todayDow;
                const animatedStyle = isToday
                  ? { transform: [{ scale: todayPop }] }
                  : {};
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.dayCircle,
                      {
                        borderColor: done ? colors.accent : colors.border,
                        backgroundColor: done ? `${colors.accent}15` : 'transparent',
                      },
                      animatedStyle,
                    ]}
                  >
                    {done ? (
                      <Check size={16} color={colors.accent} strokeWidth={2.6} />
                    ) : isToday ? (
                      <View
                        style={[styles.todayDot, { backgroundColor: colors.accent }]}
                      />
                    ) : null}
                  </Animated.View>
                );
              })}
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: colors.text }]}>
                {longestStreak}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>
                BEST
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: colors.text }]}>
                {weeklyPoints.filter((p) => p > 0).length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>
                THIS WEEK
              </Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleClose}
            style={[styles.cta, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.ctaLabel}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 36,
    paddingBottom: 24,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
  },
  numberRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  bigNumber: {
    fontSize: 88,
    fontFamily: FontFamily.semibold,
    letterSpacing: -3,
    lineHeight: 92,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  grid: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  gridLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  dayLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  gridCircles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 18,
    width: '100%',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  statNum: {
    fontSize: 22,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginTop: 2,
  },
  cta: {
    width: '100%',
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
});
