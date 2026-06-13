import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../src/store/useStore';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../src/constants/theme';
import { scoreBand } from '../src/utils/brainScore';
import { computeBenchmarkScore } from '../src/utils/benchmark';
import { hapticLight, hapticSuccess } from '../src/utils/haptics';

function scoreColor(score: number): string {
  if (score >= 70) return '#22C55E'; // sharp - green
  if (score >= 45) return '#F97316'; // mid - orange
  return '#EF4444';                  // cooked - red
}

/**
 * Benchmark reveal. Composites the per-aspect scores collected during the
 * benchmark run into the Brainpower Score, stores it, and counts it up - the
 * personalising moment that anchors the whole app.
 */
export default function BenchmarkResultScreen() {
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { benchmarkScores, dailyScreenTimeHours, setBrainScore, clearBenchmarkScores, recordCognitiveScore } = useStore();

  const targetRef = useRef<number>(
    computeBenchmarkScore(dailyScreenTimeHours, benchmarkScores),
  );
  const [display, setDisplay] = useState(0);

  // Commit the score + count up, once.
  useEffect(() => {
    const target = targetRef.current;
    setBrainScore(target);

    // Seed ONLY the areas the benchmark actually measures. The untested ones
    // (Reaction time, Calm, General knowledge) stay at 0 until the user trains
    // them in the Brain Gym - no made-up ratings.
    const bs = benchmarkScores;
    if (typeof bs.memory === 'number') recordCognitiveScore('memory', bs.memory);
    if (typeof bs.attention === 'number') recordCognitiveScore('attention', bs.attention);
    if (typeof bs.problemSolving === 'number') recordCognitiveScore('problemSolving', bs.problemSolving);

    clearBenchmarkScores();

    let step = 0;
    const STEPS = 32;
    const id = setInterval(() => {
      step += 1;
      const t = Math.min(1, step / STEPS);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(target * eased));
      if (t >= 1) {
        clearInterval(id);
        hapticSuccess();
      }
    }, 28);
    return () => clearInterval(id);
  }, []);

  const target = targetRef.current;
  const band = scoreBand(target);
  const color = scoreColor(target);

  const done = () => {
    hapticLight();
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.center}>
        <Text style={[styles.eyebrow, { color: colors.muted }]}>YOUR BRAINPOWER SCORE</Text>
        <Text style={[styles.score, { color }]}>{display}</Text>
        <View style={[styles.pill, { backgroundColor: `${color}1A`, borderColor: `${color}40` }]}>
          <Text style={[styles.pillText, { color }]}>{band.emoji}  {band.label.toUpperCase()}</Text>
        </View>
        <Text style={[styles.caption, { color: colors.muted }]}>
          This is your starting point. Every rep in the Brain Gym pushes it up.
        </Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity activeOpacity={0.88} onPress={done} style={[styles.cta, { backgroundColor: colors.accent }]}>
          <Text style={styles.ctaText}>Let's build it up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 12, fontFamily: FontFamily.medium, letterSpacing: 1.8, marginBottom: 4 },
  score: { fontSize: 132, fontFamily: FontFamily.heavy, letterSpacing: -5, lineHeight: 138, fontVariant: ['tabular-nums'] },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, marginTop: 4 },
  pillText: { fontSize: 14, fontFamily: FontFamily.semibold, letterSpacing: 1 },
  caption: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 28,
    paddingHorizontal: 24,
  },
  bottom: {},
  cta: { height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
});
