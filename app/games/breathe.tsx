import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import { hapticLight, hapticSuccess } from '../../src/utils/haptics';
import { useStore } from '../../src/store/useStore';

/**
 * Box breathing - the "Calm" seed of the Gym. Four equal phases
 * (in / hold / out / hold), a handful of cycles, then done. A simple,
 * honest breathing reset - not a meditation library, just the one rep.
 */
const PHASE_MS = 4000;
const TOTAL_CYCLES = 4;
const PHASES = ['Breathe in', 'Hold', 'Breathe out', 'Hold'] as const;

export default function BreatheScreen() {
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [done, setDone] = useState(false);
  const adjustBrainScore = useStore((s) => s.adjustBrainScore);
  const recordCognitiveScore = useStore((s) => s.recordCognitiveScore);

  // A completed calm rep counts as training - pushes the overall score up and
  // builds the Calm area (the mindfulness key behind it).
  useEffect(() => {
    if (done) {
      adjustBrainScore(+2);
      recordCognitiveScore('mindfulness', 85);
    }
  }, [done]);

  const scale = useRef(new Animated.Value(0.55)).current;
  const phaseRef = useRef(0);
  const cycleRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const runPhase = () => {
      if (cancelled) return;
      const idx = phaseRef.current;
      setPhaseIdx(idx);
      hapticLight();

      // 0 in → grow, 2 out → shrink, holds stay put.
      const target = idx === 0 ? 1 : idx === 2 ? 0.55 : (idx === 1 ? 1 : 0.55);
      Animated.timing(scale, {
        toValue: target,
        duration: PHASE_MS,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelled) return;
        const next = (phaseRef.current + 1) % 4;
        phaseRef.current = next;
        if (next === 0) {
          const c = cycleRef.current + 1;
          cycleRef.current = c;
          setCycle(c);
          if (c >= TOTAL_CYCLES) {
            hapticSuccess();
            setDone(true);
            return;
          }
        }
        runPhase();
      });
    };

    runPhase();
    return () => { cancelled = true; };
  }, []);

  const finish = () => {
    hapticLight();
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + 12, backgroundColor: colors.cardAlt }]}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <X size={20} color={colors.muted} />
      </TouchableOpacity>

      <View style={styles.center}>
        {!done ? (
          <>
            <Text style={[styles.cycleLabel, { color: colors.muted }]}>
              {cycle + 1} of {TOTAL_CYCLES}
            </Text>
            <View style={styles.circleWrap}>
              <Animated.View
                style={[
                  styles.circle,
                  { backgroundColor: `${colors.accent}22`, borderColor: colors.accent, transform: [{ scale }] },
                ]}
              />
              <Text style={[styles.phaseText, { color: colors.text }]}>{PHASES[phaseIdx]}</Text>
            </View>
            <Text style={[styles.hint, { color: colors.muted }]}>Follow the circle.</Text>
          </>
        ) : (
          <>
            <View style={[styles.doneIcon, { backgroundColor: `${colors.accent}1A`, borderColor: `${colors.accent}40` }]}>
              <Check size={36} color={colors.accent} strokeWidth={2.4} />
            </View>
            <Text style={[styles.doneTitle, { color: colors.text }]}>Nice and calm.</Text>
            <Text style={[styles.doneSub, { color: colors.muted }]}>One rep down. Your focus just reset.</Text>
          </>
        )}
      </View>

      {done && (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={finish}
            style={[
              styles.doneBtn,
              { backgroundColor: colors.accent },
              Platform.OS === 'ios' && { shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
            ]}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  cycleLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.4,
    marginBottom: 40,
  },
  circleWrap: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center' },
  circle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 2,
  },
  phaseText: {
    fontSize: 26,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.5,
  },
  hint: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginTop: 44,
  },
  doneIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  doneTitle: {
    fontSize: 28,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.6,
  },
  doneSub: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    marginTop: 10,
    textAlign: 'center',
  },
  bottom: { paddingHorizontal: Spacing.xl },
  doneBtn: {
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
});
