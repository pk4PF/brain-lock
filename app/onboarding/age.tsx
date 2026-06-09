import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, PanResponder, ScrollView,
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

const MIN_AGE = 1;
const MAX_AGE = 100;
const STEP = 1;

export default function AgeScreen() {
  useOnboardingStepView('age');
  const { colors } = useThemeColors();
  const { userAge, setUserAge, userName } = useStore();
  const firstName = userName.trim().split(/\s+/)[0] || '';
  const [age, setAge] = useState<number>(userAge ?? 22);

  const advance = () => {
    setUserAge(age);
    track(Events.AgeSelected, { age });
    router.push('/onboarding/screentime');
  };

  return (
    <OnboardingLayout step={5} totalSteps={12}>
      <OnboardingBackButton />
      {/* ScrollView wrap so iOS Display Zoom + Dynamic Type users can still
          reach the Continue button. Slider PanResponder still wins on
          horizontal drags because it sets onStartShouldSetPanResponderCapture
          and onPanResponderTerminationRequest=false. */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
            <Slider
              value={age}
              onChange={setAge}
              min={MIN_AGE}
              max={MAX_AGE}
              step={STEP}
              colors={colors}
            />
            <View style={styles.tickRow}>
              <Text style={[styles.tick, { color: colors.muted }]}>{MIN_AGE}</Text>
              <Text style={[styles.tick, { color: colors.muted }]}>{MAX_AGE}+</Text>
            </View>
          </FadeUp>
        </View>

        <FadeUp delay={500} travel={20}>
          <View style={styles.bottomContainer}>
            <OnboardingButton label="Continue" onPress={advance} />
          </View>
        </FadeUp>
      </ScrollView>
    </OnboardingLayout>
  );
}

// Same PanResponder slider as screentime - duplicated locally so it stays
// inline with the screen and doesn't pull a global dependency for a 50-line
// primitive. Both screens use the same gesture pattern.
interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  colors: any;
}

function Slider({ value, onChange, min, max, step, colors }: SliderProps) {
  const wrapRef = useRef<View>(null);
  const [width, setWidth] = useState(0);

  const widthRef = useRef(0);
  widthRef.current = width;
  const trackPageX = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastHapticVal = useRef<number>(value);

  const apply = (screenX: number) => {
    const w = widthRef.current;
    if (w <= 0) return;
    const localX = screenX - trackPageX.current;
    const clamped = Math.max(0, Math.min(w, localX));
    const pct = clamped / w;
    const raw = min + pct * (max - min);
    const stepped = Math.round(raw / step) * step;
    const next = Math.max(min, Math.min(max, stepped));
    if (next !== lastHapticVal.current) {
      hapticLight();
      lastHapticVal.current = next;
    }
    if (next !== valueRef.current) onChangeRef.current(next);
  };

  const applyRef = useRef(apply);
  applyRef.current = apply;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (_e, gs) => {
        wrapRef.current?.measureInWindow((x: number) => {
          trackPageX.current = x;
          applyRef.current(gs.x0);
        });
      },
      onPanResponderMove: (_e, gs) => {
        applyRef.current(gs.moveX);
      },
    }),
  ).current;

  // Cast to any: RN accepts percentage strings at runtime even though
  // the type system insists on number | DimensionValue.
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const pctStr: any = `${pct * 100}%`;

  return (
    <View
      ref={wrapRef}
      onLayout={(e) => {
        setWidth(e.nativeEvent.layout.width);
        wrapRef.current?.measureInWindow((x: number) => {
          trackPageX.current = x;
        });
      }}
      style={styles.sliderTrackHit}
      {...responder.panHandlers}
    >
      <View style={[styles.sliderTrack, { backgroundColor: colors.cardAlt }]} pointerEvents="none">
        <View
          style={[
            styles.sliderFill,
            { backgroundColor: colors.accent, width: pctStr },
          ]}
        />
        <View
          style={[
            styles.sliderThumb,
            { backgroundColor: colors.accent, borderColor: colors.background, left: pctStr },
          ]}
        />
      </View>
    </View>
  );
}

const SLIDER_HEIGHT = 6;
const THUMB_SIZE = 28;

const styles = StyleSheet.create({
  // flexGrow inside ScrollView contentContainerStyle so children fill the
  // viewport when content fits, but can grow taller (and scroll) when zoom
  // pushes them past the available height.
  content: { flexGrow: 1, justifyContent: 'space-between' },
  top: { paddingTop: 96, paddingHorizontal: Spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'stretch', paddingHorizontal: Spacing.xl },
  bigReadout: { alignItems: 'center', marginBottom: 28 },
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
  sliderTrackHit: { width: '100%', paddingVertical: 18, justifyContent: 'center' },
  sliderTrack: {
    height: SLIDER_HEIGHT,
    borderRadius: SLIDER_HEIGHT / 2,
    width: '100%',
    overflow: 'visible',
    justifyContent: 'center',
  },
  sliderFill: {
    height: SLIDER_HEIGHT,
    borderRadius: SLIDER_HEIGHT / 2,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    top: (SLIDER_HEIGHT - THUMB_SIZE) / 2,
    marginLeft: -THUMB_SIZE / 2,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  tickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  tick: { fontSize: 12, fontFamily: FontFamily.medium, letterSpacing: 1.2 },
  bottomContainer: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
});
