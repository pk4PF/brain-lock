import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  ScrollView,
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

export default function ScreentimeScreen() {
  useOnboardingStepView('screentime');
  const { colors, isDark } = useThemeColors();
  const { dailyScreenTimeHours, setDailyScreenTimeHours, userName } = useStore();
  // Default to 4 if no answer yet (or zeroed out by a fresh reset).
  const [hours, setHours] = useState<number>(dailyScreenTimeHours || 4);
  const firstName = userName.trim().split(/\s+/)[0] || '';

  const advance = () => {
    setDailyScreenTimeHours(hours);
    track(Events.ScreentimeReported, { hours });
    router.push('/onboarding/insecurity');
  };


  return (
    <OnboardingLayout step={2}>
      <OnboardingBackButton />
      {/* ScrollView wrap for accessibility (zoom + Dynamic Type). Slider
          PanResponder still captures horizontal drags because it sets
          onStartShouldSetPanResponderCapture and refuses termination. */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <FadeUp delay={0}>
            <Eyebrow>Step 1 of 3</Eyebrow>
          </FadeUp>
          <FadeUp delay={80}>
            <SectionHeading size="lg">
              {firstName
                ? `${firstName}, how much do you scroll?`
                : 'How much do you scroll?'}
            </SectionHeading>
          </FadeUp>
          <View style={{ height: 10 }} />
          <FadeUp delay={160}>
            <MutedText size="md">
              Estimate your daily average. No need to check.
            </MutedText>
          </FadeUp>
        </View>

        <View style={styles.center}>
          <FadeUp delay={260}>
            <View style={styles.bigReadout}>
              <Text style={[styles.bigNumber, { color: colors.accent }]}>
                {formatHours(hours)}
              </Text>
              <Text style={[styles.bigUnit, { color: colors.muted }]}>
                HOURS / DAY
              </Text>
            </View>
          </FadeUp>

          <FadeUp delay={360}>
            <Slider
              value={hours}
              onChange={setHours}
              min={MIN_HOURS}
              max={MAX_HOURS}
              step={STEP}
              colors={colors}
            />

            <View style={styles.tickRow}>
              <Text style={[styles.tick, { color: colors.muted }]}>{MIN_HOURS}h</Text>
              <Text style={[styles.tick, { color: colors.muted }]}>{MAX_HOURS}h</Text>
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

function formatHours(h: number): string {
  if (Number.isInteger(h)) return `${h}`;
  return h.toFixed(1);
}

interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  colors: any;
}

/**
 * PanResponder slider, bulletproof version.
 *
 * Strategy: measure the track's screen-X with `measureInWindow` on grant,
 * then use `gestureState.moveX` (the touch's screen-X) directly. This is
 * the most reliable RN gesture pattern - no closure staleness, no race
 * with onLayout, no pageX-locationX math that breaks on nested views.
 *
 * Refs:
 *   wrapRef       - the track view, for measuring
 *   trackPageX    - screen-X of the track's left edge
 *   trackWidth    - width of the track
 *   onChangeRef   - latest onChange callback (props change between renders)
 *   valueRef      - current value (read inside the responder)
 */
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

  // Create the responder ONCE so its handlers are stable across renders.
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (_e, gs) => {
        // Re-measure on every grant so we always have a fresh screen-X.
        // measureInWindow gives screen coords reliably across iOS/Android.
        wrapRef.current?.measureInWindow((x: number) => {
          trackPageX.current = x;
          applyRef.current(gs.x0); // x0 = initial touch screen-X
        });
      },
      onPanResponderMove: (_e, gs) => {
        applyRef.current(gs.moveX); // moveX = current touch screen-X
      },
    }),
  ).current;

  // Use percentage positioning for visuals so the thumb sits in the right
  // place even before onLayout fires (no "thumb stuck at 0" flash).
  // Cast to any because RN accepts percentage strings at runtime even
  // though the type system insists on number | DimensionValue.
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
            {
              backgroundColor: colors.accent,
              borderColor: colors.background,
              left: pctStr,
            },
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
  top: {
    paddingTop: 72,
    paddingHorizontal: Spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: Spacing.xl,
  },
  bigReadout: {
    alignItems: 'center',
    marginBottom: 28,
  },
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
  sliderTrackHit: {
    width: '100%',
    paddingVertical: 18,
    justifyContent: 'center',
  },
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
  tick: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.2,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
});
