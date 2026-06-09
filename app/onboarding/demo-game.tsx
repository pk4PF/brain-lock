import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, AccessibilityInfo, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brain } from 'phosphor-react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import { hapticLight } from '../../src/utils/haptics';
import { track, Events } from '../../src/services/analytics';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { Eyebrow, SectionHeading, MutedText, PillButton } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

export default function DemoGameScreen() {
  useOnboardingStepView('demo_game');
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();

  // Skip = bail on the whole game-demo trio (game + earn celebration)
  // and jump straight to the unlock demo. Tracked separately so we can
  // see the skip rate in PostHog and decide whether the game-demo path
  // is converting better than the skip path.
  const handleSkip = () => {
    hapticLight();
    track(Events.DemoGameSkipped);
    router.push('/onboarding/demo-spend');
  };

  // Big bouncy brain entrance + a slow idle bob.
  // Spring scale-in from 0.6 + a sine-wave bob keep the screen feeling
  // alive without being noisy. Reduce-Motion users skip the bob entirely.
  const scale = useRef(new Animated.Value(0.65)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let bobLoop: Animated.CompositeAnimation | null = null;
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4.5, tension: 65, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      bobLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
      // Start the idle bob after the entrance settles.
      const t = setTimeout(() => bobLoop?.start(), 700);
      return () => { clearTimeout(t); bobLoop?.stop(); };
    });
  }, []);

  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <OnboardingLayout step={11} totalSteps={16}>
      <OnboardingBackButton />

      {/* Skip - mirrors the back button on the right. Plain text link
          so it reads as an escape hatch, not a peer of the primary CTA. */}
      <TouchableOpacity
        style={[styles.skipBtn, { top: insets.top + 60 }]}
        onPress={handleSkip}
        activeOpacity={0.6}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={[styles.skipText, { color: colors.muted }]}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.center}>
          {/* Big animated brain - no plate, no box. Just the illustration. */}
          <Animated.View
            style={[
              styles.iconWrap,
              { opacity, transform: [{ scale }, { translateY: bobY }] },
            ]}
          >
            <Brain
              size={140}
              color={colors.accent}
              weight="duotone"
              duotoneColor={colors.accent}
              duotoneOpacity={0.22}
            />
          </Animated.View>

          <FadeUp delay={120}>
            <Eyebrow style={styles.eyebrowCenter}>Try a challenge</Eyebrow>
          </FadeUp>

          <FadeUp delay={200}>
            <SectionHeading size="lg" align="center">
              Memory Tiles
            </SectionHeading>
          </FadeUp>

          <View style={{ height: 8 }} />

          <FadeUp delay={280}>
            <MutedText size="md" align="center">
              Tiles light up. Remember where. Tap them back.
            </MutedText>
          </FadeUp>

          {/* Inline chips. The "+5 cells" chip is highlighted - that's
              the reward, surfaced upfront so it's the dopamine hook. */}
          <FadeUp delay={400}>
            <View style={styles.chips}>
              <Chip label="3 rounds" colors={colors} />
              <Chip label="≈ 45s" colors={colors} />
              <Chip label="Spatial memory" highlight colors={colors} />
            </View>
          </FadeUp>
        </View>

        <FadeUp delay={520} travel={20}>
          <View style={styles.bottomContainer}>
            <PillButton
              label="Try it"
              onPress={() => router.push('/games/tile-recall?demo=1')}
              fullWidth
            />
          </View>
        </FadeUp>
      </View>
    </OnboardingLayout>
  );
}

function Chip({
  label,
  highlight,
  colors,
}: {
  label: string;
  highlight?: boolean;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: highlight ? colors.accentLight : colors.cardAlt,
          borderColor: highlight ? colors.accent : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: highlight ? colors.accent : colors.secondary },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    marginBottom: 28,
  },
  eyebrowCenter: {
    textAlign: 'center',
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
  // Skip text link - mirrors OnboardingBackButton's positioning on the
  // right edge, but renders as plain text instead of a circular icon
  // so it reads as a quiet escape hatch.
  skipBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    height: 40,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },
});

