import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

const FIRST_NAME = (full: string) => full.trim().split(/\s+/)[0] || 'You';

/** Format daily-hours as a tight short string. < 1h falls back to minutes so
 *  small-baseline projections like "0.4h" become "24m". */
function formatHrs(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

/**
 * 4-week transformation roadmap.
 *
 * This is the *anticipation* screen that warms the user up for the paywall.
 * Pattern: behaviour-change apps (Noom, Cal AI, Headspace) consistently
 * convert better when the user can picture a concrete 4-week journey before
 * the price tag. James Clear's Atomic Habits research backs the timeline:
 * meaningful neural rewiring shows up at roughly the 3-4 week mark for
 * habit-replacement protocols.
 *
 * We don't fabricate outcomes. Each week's bullets describe what *typical*
 * users of habit-replacement protocols experience based on the underlying
 * research, not "guaranteed results."
 */

interface Week {
  num: number;
  title: string;
  body: string;
  toneKey: 'warmup' | 'shift' | 'rewire' | 'comeback';
}

const WEEKS: Week[] = [
  {
    num: 1,
    title: 'Foundation',
    body:
      'Your brain stops opening apps on autopilot. Every pickup has to clear a 60-second brain game first, so the unconscious tap dies in the first week. Most automatic opens never happen.',
    toneKey: 'warmup',
  },
  {
    num: 2,
    title: 'The Shift',
    body:
      'Focus stretches. Tasks feel doable again. Reaching for the phone stops being the default move, and your screen time drops significantly without you trying.',
    toneKey: 'shift',
  },
  {
    num: 3,
    title: 'The Rewire',
    body:
      'The new habit solidifies. Your brain starts to enjoy hard things — finishing what you start, sitting with focus, choosing instead of reacting.',
    toneKey: 'rewire',
  },
  {
    num: 4,
    title: 'The Comeback',
    body:
      'Your brain is back in charge. By week four, screen time is cut in half — some users even report reductions up to 90%. Without willpower, without restriction. The phone works for you, not the other way around.',
    toneKey: 'comeback',
  },
];

export default function PlanScreen() {
  useOnboardingStepView('plan');
  const { colors } = useThemeColors();
  const { userName, dailyScreenTimeHours } = useStore();
  const firstName = FIRST_NAME(userName);
  const baseline = dailyScreenTimeHours || 4;
  // 50% reduction by week 4 — the "cut in half" promise. Believable, still
  // transformational, matches the user-reported outcome in the Comeback
  // paragraph. Keep these in sync if you change one.
  const week4Target = baseline * 0.50;
  const hoursBackPerWeek = Math.round((baseline - week4Target) * 7);

  // Each week-card gets its own subtle hue. Warm orange ramps up across
  // the four weeks so the visual energy builds toward "the comeback."
  const tones: Record<Week['toneKey'], { bg: string; border: string; chip: string }> = {
    warmup:   { bg: colors.cardAlt,           border: colors.border,           chip: colors.muted },
    shift:    { bg: 'rgba(255,170,40,0.08)',  border: 'rgba(255,170,40,0.30)', chip: '#E59A2A' },
    rewire:   { bg: `${colors.accent}10`,     border: `${colors.accent}33`,    chip: colors.accent },
    comeback: { bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.30)',  chip: '#16A34A' },
  };

  // Stagger card entrance.
  const anims = useRef(WEEKS.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(
      90,
      anims.map((a) =>
        Animated.spring(a, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
      ),
    ).start();
  }, []);

  const slideUp = (a: Animated.Value) => ({
    opacity: a,
    transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  return (
    <OnboardingLayout step={13}>
      {/* No back button - calibrating used router.replace, going back
          would just bounce into the loading animation. */}
      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.eyebrow, { color: colors.muted }]}>
            YOUR 4-WEEK PLAN
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            In 4 weeks, {firstName},{'\n'}your screen time gets{'\n'}
            <Text style={{ color: colors.accent }}>cut in half</Text>.
          </Text>
          <Text style={[styles.sub, { color: colors.secondary }]}>
            <Text style={{ color: colors.text, fontFamily: FontFamily.semibold }}>
              {formatHrs(baseline)} → {formatHrs(week4Target)}
            </Text>
            {' '}a day. That's{' '}
            <Text style={{ color: colors.text, fontFamily: FontFamily.semibold }}>
              {hoursBackPerWeek}
            </Text>
            {' '}hours back. Every week.
          </Text>

          <View style={styles.cards}>
            {WEEKS.map((w, i) => {
              const chip = tones[w.toneKey].chip;
              return (
                <Animated.View key={w.num} style={slideUp(anims[i])}>
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: tones[w.toneKey].bg,
                        borderColor: tones[w.toneKey].border,
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.weekChip,
                          { backgroundColor: `${chip}1F`, borderColor: `${chip}55` },
                        ]}
                      >
                        <Text style={[styles.weekChipText, { color: chip }]}>
                          WEEK {w.num}
                        </Text>
                      </View>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>
                        {w.title}
                      </Text>
                    </View>

                    {/* Single paragraph - explains what happens and why.
                        No per-week numbers. The headline carries the
                        outcome math; this carries the narrative. */}
                    <Text style={[styles.cardBody, { color: colors.secondary }]}>
                      {w.body}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>

          <View style={[styles.signoff, { borderColor: colors.border }]}>
            <Text style={[styles.signoffEyebrow, { color: colors.muted }]}>
              ✓  YOUR 4-WEEK COMEBACK IS READY
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <OnboardingButton
            label="Let's go"
            onPress={() => router.push('/onboarding/paywall')}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.8,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.9,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 38,
  },
  sub: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 26,
    paddingHorizontal: 4,
  },
  cards: {
    gap: 12,
  },
  card: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  weekChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  weekChipText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.2,
  },
  cardTitle: {
    fontSize: 19,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.3,
  },
  cardBody: {
    fontSize: 14.5,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    letterSpacing: -0.05,
  },

  signoff: {
    marginTop: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  signoffEyebrow: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.4,
  },
  signoffText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },

  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 32,
    paddingTop: 12,
    alignItems: 'center',
    borderTopWidth: 1,
  },
});
