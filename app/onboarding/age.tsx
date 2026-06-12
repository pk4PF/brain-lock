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

const MIN_AGE = 0;
const MAX_AGE = 100;
const DEFAULT_AGE = 20;
const TICK_SPACING = 13;            // horizontal px between age ticks
const SCREEN_W = Dimensions.get('window').width;
const SIDE_PAD = SCREEN_W / 2 - TICK_SPACING / 2; // centers a tick under the marker

export default function AgeScreen() {
  useOnboardingStepView('age');
  const { colors } = useThemeColors();
  const { userAge, setUserAge, userName } = useStore();
  const firstName = userName.trim().split(/\s+/)[0] || '';

  const initialAge = userAge ?? DEFAULT_AGE;
  const [age, setAge] = useState<number>(initialAge);
  const lastVal = useRef<number>(initialAge);

  const advance = () => {
    setUserAge(age);
    track(Events.AgeSelected, { age });
    router.push('/onboarding/screentime');
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / TICK_SPACING);
    const next = Math.max(MIN_AGE, Math.min(MAX_AGE, MIN_AGE + idx));
    if (next !== lastVal.current) {
      lastVal.current = next;
      hapticLight();
      setAge(next);
    }
  };

  // Ticks never change, so build them once — only the readout re-renders
  // as you scrub. Major tick every 5; numeric label every 10.
  const ticks = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let a = MIN_AGE; a <= MAX_AGE; a++) {
      const major = a % 5 === 0;
      const labelled = a % 10 === 0;
      out.push(
        <View key={a} style={styles.tickSlot}>
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
            <Text style={[styles.tickLabel, { color: colors.muted }]}>{a}</Text>
          )}
        </View>,
      );
    }
    return out;
  }, [colors.borderStrong, colors.muted]);

  return (
    <OnboardingLayout step={5} totalSteps={15}>
      <OnboardingBackButton />
      <View style={styles.content}>
        <View style={styles.top}>
          <FadeUp delay={0}>
            <Eyebrow>One more</Eyebrow>
          </FadeUp>
          <FadeUp delay={80}>
            <SectionHeading size="lg">
              {firstName ? `${firstName}, how old are you?` : 'How old are you?'}
            </SectionHeading>
          </FadeUp>
          <View style={{ height: 10 }} />
          <FadeUp delay={160}>
            <MutedText size="md">
              Used for your personalised plan.
            </MutedText>
          </FadeUp>
        </View>

        <View style={styles.center}>
          <FadeUp delay={260}>
            <View style={styles.bigReadout}>
              <Text style={[styles.bigNumber, { color: colors.accent }]}>{age}</Text>
              <Text style={[styles.bigUnit, { color: colors.muted }]}>YEARS OLD</Text>
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
                contentOffset={{ x: (initialAge - MIN_AGE) * TICK_SPACING, y: 0 }}
                contentContainerStyle={{ paddingHorizontal: SIDE_PAD }}
              >
                <View style={styles.ticksRow}>{ticks}</View>
              </ScrollView>

              {/* Fixed center marker the ruler scrolls under. */}
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
  top: { paddingTop: 96, paddingHorizontal: Spacing.xl },
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
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginTop: 4,
  },
  rulerWrap: {
    height: 64,
    justifyContent: 'center',
  },
  ticksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
  },
  tickSlot: {
    width: TICK_SPACING,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
  },
  tick: {
    width: 2,
    borderRadius: 1,
  },
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
  marker: {
    width: 3,
    height: MARKER_H,
    borderRadius: 2,
  },
  bottomContainer: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
});
