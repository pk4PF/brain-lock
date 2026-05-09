import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, FontSize, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

/**
 * Welcome screen - first thing a user sees.
 *
 * Design principles:
 *  • Typography does the work. No icon collages, no decorative shapes.
 *  • One brand mark, one headline, one supporting line. That's the page.
 *  • Lots of breathing room - the whitespace IS the design.
 *  • A single colour accent on the word that carries the meaning.
 *  • CTA at the bottom, legal beneath, nothing else competing.
 */
export default function WelcomeScreen() {
  useOnboardingStepView('welcome');
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();

  const start = () => router.push('/onboarding/problem');

  return (
    <OnboardingLayout>
      {/* ScrollView wrap: large Dynamic Type (Settings → Accessibility →
          Display & Text Size → Larger Text) plus Display Zoom can push the
          "Get started" button below the viewport. flexGrow:1 keeps the
          space-between layout when content fits. */}
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Centre - logo + one big headline. */}
        <View style={styles.center}>
          <FadeUp delay={60}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </FadeUp>

          <View style={{ height: 28 }} />

          <FadeUp delay={140}>
            <Text style={[styles.headline, { color: colors.text }]}>
              Welcome to{'\n'}
              <Text style={{ color: colors.accent }}>BrainLock</Text>
            </Text>
          </FadeUp>
        </View>

        {/* Bottom - CTA */}
        <FadeUp delay={460} travel={20}>
          <View style={styles.bottom}>
            <OnboardingButton label="Get started" onPress={start} />
          </View>
        </FadeUp>
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    // flexGrow inside ScrollView contentContainerStyle so children fill the
    // viewport when content fits, but can grow taller (and scroll) when
    // accessibility text scaling pushes them past the available height.
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    justifyContent: 'space-between',
  },

  // Top brand mark - small, calm, restrained.
  brand: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.3,
  },

  // Centre - logo + headline drive the whole page.
  center: {
    alignItems: 'flex-start',
    paddingTop: 40,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 22,
  },
  headline: {
    fontSize: 56,
    fontFamily: FontFamily.medium,
    letterSpacing: -2.0,
    lineHeight: 60,
  },

  // A single accent line - the only "decoration" we use.
  // Replaces icons / mascots / illustrations.
  divider: {
    width: 36,
    height: 3,
    borderRadius: 2,
  },

  sub: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.regular,
    lineHeight: 28,
    letterSpacing: -0.2,
  },

  // Bottom CTA + legal.
  bottom: {
    gap: 16,
  },
});
