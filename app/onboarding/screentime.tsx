import { useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight } from '../../src/utils/haptics';
import { FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { Eyebrow, SectionHeading, MutedText } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';
import { track, Events } from '../../src/services/analytics';

const MIN_HOURS = 0;
const MAX_HOURS = 18;
const STEP = 0.5;
const DEFAULT_HOURS = 4;
const TICK_COUNT = Math.round((MAX_HOURS - MIN_HOURS) / STEP) + 1; // 37 ticks
const TICK_SPACING = 13;
const SCREEN_W = Dimensions.get('window').width;
const SIDE_PAD = SCREEN_W / 2 - TICK_SPACING / 2;

function formatHours(h: number): string {
  return Number.isInteger(h) ? `${h}` : h.toFixed(1);
}

export default function ScreentimeScreen() {
  useOnboardingStepView('screentime');
  const { colors } = useThemeColors();
  const { dailyScreenTimeHours, setDailyScreenTimeHours, userName } = useStore();
  const firstName = userName.trim().split(/\s+/)[0] || '';

  const initialHours = dailyScreenTimeHours || DEFAULT_HOURS;
  const [hours, setHours] = useState<number>(initialHours);
  const lastVal = useRef<number>(initialHours);

  const advance = () => {
    setDailyScreenTimeHours(hours);
    track(Events.ScreentimeReported, { hours });
    router.push('/onboarding/insecurity');
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / TICK_SPACING);
    const next = Math.max(MIN_HOURS, Math.min(MAX_HOURS, MIN_HOURS + idx * STEP));
    if (next !== lastVal.current) {
      lastVal.current = next;
      hapticLight();
      setHours(next);
    }
  };

  // Ticks built once; only the readout re-renders while scrubbing.
  // Major tick on each whole hour, numeric label every 2 hours.
  const ticks = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let i = 0; i < TICK_COUNT; i++) {
      const v = MIN_HOURS + i * STEP;
      const major = Number.isInteger(v);
      const labelled = v % 2 === 0;
      out.push(
        <View key={i} style={styles.tickSlot}>
          <View
            style={[
              styles.tick,
              {
                height: major ? 26 : 14,
                backgroundColor: colors.borderStrong,
                opacity: major ? 0.9 : 0.5,
              },
            ]}
          />
          {labelled && (
            <Text style={[styles.tickLabel, { color: colors.muted }]}>{v}</Text>
          )}
        </View>,
      );
    }
    return out;
  }, [colors.borderStrong, colors.muted]);

  return (
    <OnboardingLayout step={6} totalSteps={15}>
      <OnboardingBackButton />
      <View style={styles.content}>
        <View style={styles.top}>
          <FadeUp delay={0}>
            <Eyebrow>About you</Eyebrow>
          </FadeUp>
          <FadeUp delay={80}>
            <SectionHeading size="lg">
              {firstName
                ? `${firstName}, what's your daily screen time?`
                : "What's your daily screen time?"}
            </SectionHeading>
          </FadeUp>
          <View style={{ height: 10 }} />
          <FadeUp delay={160}>
            <MutedText size="md">You probably know your number — roughly is fine.</MutedText>
          </FadeUp>
        </View>

        <View style={styles.center}>
          <FadeUp delay={260}>
            <View style={styles.bigReadout}>
              <Text style={[styles.bigNumber, { color: colors.accent }]}>
                {formatHours(hours)}
              </Text>
              <Text style={[styles.bigUnit, { color: colors.muted }]}>HOURS / DAY</Text>
            </View>
          </FadeUp>

          <FadeUp delay={360}>
            <View style={styles.rulerWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={TICK_SPACING}
                decelerationRate="fast"
                scrollEventThrottle={16}
                onScroll={onScroll}
                contentOffset={{ x: ((initialHours - MIN_HOURS) / STEP) * TICK_SPACING, y: 0 }}
                contentContainerStyle={{ paddingHorizontal: SIDE_PAD }}
              >
                <View style={styles.ticksRow}>{ticks}</View>
              </ScrollView>

              <View pointerEvents="none" style={styles.markerWrap}>
                <View style={[styles.marker, { backgroundColor: colors.accent }]} />
              </View>
            </View>
          </FadeUp>
        </View>

        <View style={styles.bottomContainer}>
          <OnboardingButton label="Continue" onPress={advance} />
        </View>
      </View>
    </OnboardingLayout>
  );
}

const MARKER_H = 44;

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  top: { paddingTop: 72, paddingHorizontal: Spacing.xl },
  center: { flex: 1, justifyContent: 'center' },
  bigReadout: { alignItems: 'center', marginBottom: 40 },
  bigNumber: {
    fontSize: 96,
    fontFamily: FontFamily.medium,
    letterSpacing: -4,
    lineHeight: 100,
    fontVariant: ['tabular-nums'],
  },
  bigUnit: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginTop: 4,
  },
  rulerWrap: { height: 64, justifyContent: 'center' },
  ticksRow: { flexDirection: 'row', alignItems: 'center', height: 64 },
  tickSlot: {
    width: TICK_SPACING,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
  },
  tick: { width: 2, borderRadius: 1 },
  tickLabel: {
    position: 'absolute',
    top: 36,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    width: 40,
    textAlign: 'center',
  },
  markerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  marker: { width: 3, height: MARKER_H, borderRadius: 2 },
  bottomContainer: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
});
