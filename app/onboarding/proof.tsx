import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star } from 'lucide-react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

/**
 * Social proof, the final screen before the paywall. Every quote below is a
 * real App Store review, verbatim — no fabrication, ever.
 *
 * Honesty note: the badge intentionally does NOT claim "#1 app" or a user
 * count (e.g. "500,000 people"). Those would be false at current scale and
 * Apple rejects unsubstantiated ranking/count claims. Swap in a real number
 * only once it is true.
 */
const REVIEWS: { title: string; body: string; author: string }[] = [
  {
    title: 'At last, I can be productive on my phone',
    body: 'I was so hooked on my phone, needlessly scrolling watching junk. I’ve blocked those apps now and if I get withdrawal symptoms, I earn time by being productive training my brain.',
    author: 'Eugey Pugey',
  },
  {
    title: 'More focus for me',
    body: 'What a great idea and a smart little app it’s really helping me focus',
    author: 'Saidef',
  },
  {
    title: 'Amazing!!',
    body: 'What a smart and insightful app that has thought of everything! Highly recommend.',
    author: 'Khs69',
  },
];

function Stars({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <View style={styles.starsRow}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} color={color} fill={color} strokeWidth={0} />
      ))}
    </View>
  );
}

export default function ProofScreen() {
  useOnboardingStepView('proof');
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <OnboardingLayout>
      <OnboardingBackButton />
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.body, { paddingTop: insets.top + 116 }]}
          showsVerticalScrollIndicator={false}
        >
          <FadeUp>
            <Text style={[styles.headline, { color: colors.text }]}>
              brainlock was built for{' '}
              <Text style={{ color: colors.accent }}>people done with brain rot</Text>.
            </Text>
          </FadeUp>
          <FadeUp delay={80}>
            <Text style={[styles.subhead, { color: colors.muted }]}>
              reviews from people using brainlock.
            </Text>
          </FadeUp>

          {/* Award badge — honest: positioning + real star rating, no #1 / no fake count. */}
          <FadeUp delay={160}>
            <View style={[styles.badgeCard, { backgroundColor: `${colors.accent}0D`, borderColor: `${colors.accent}33` }]}>
              <Text style={[styles.badgeTitle, { color: colors.text }]}>built to beat brain rot</Text>
              <View style={{ height: 12 }} />
              <Stars color={colors.accent} size={22} />
              <Text style={[styles.badgeSub, { color: colors.muted }]}>
                real five-star reviews
              </Text>
            </View>
          </FadeUp>

          {REVIEWS.map((r, i) => (
            <FadeUp key={r.author} delay={240 + i * 90}>
              <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Stars color={colors.accent} size={15} />
                <Text style={[styles.reviewTitle, { color: colors.text }]}>{r.title}</Text>
                <Text style={[styles.reviewBody, { color: colors.secondary }]}>{r.body}</Text>
                <Text style={[styles.reviewAuthor, { color: colors.muted }]}>{r.author}</Text>
              </View>
            </FadeUp>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <OnboardingButton
            label="join brainlock"
            onPress={() => router.push('/onboarding/paywall')}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
  },
  headline: {
    fontSize: 34,
    fontFamily: FontFamily.semibold,
    letterSpacing: -1.1,
    lineHeight: 40,
  },
  subhead: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    letterSpacing: -0.2,
    marginTop: 12,
    marginBottom: 24,
  },
  badgeCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 32,
    marginBottom: 28,
  },
  badgeTitle: {
    fontSize: 22,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.4,
    textAlign: 'center',
    lineHeight: 26,
  },
  badgeSub: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.2,
    marginTop: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 0,
  },
  reviewCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
  },
  reviewTitle: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.3,
    marginTop: 10,
    marginBottom: 8,
  },
  reviewBody: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewAuthor: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.2,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
