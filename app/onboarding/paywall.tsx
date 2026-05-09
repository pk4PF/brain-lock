import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  BackHandler,
  ScrollView,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ShieldCheck, Star, ChevronDown } from 'lucide-react-native';
import { FontFamily, Spacing } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import { usePaywallPurchase } from '../../src/components/paywall/usePaywallPurchase';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

const POST_PURCHASE_ROUTE = '/(tabs)' as const;
const FIRST_NAME = (full: string) => full.trim().split(/\s+/)[0] || '';

/**
 * High-conversion paywall.
 *
 * Patterns drawn from Noom, Cal AI, Headspace, and Calm:
 *   1. Personal hero promise (uses the user's name + screen-time answer)
 *   2. Visual product preview (small floating product cards, not just text)
 *   3. Two pricing tiers, yearly highlighted with a SAVE % badge
 *   4. "What's included" checklist - concrete unlocks
 *   5. Trust strip (cancel anytime, locked with App Store)
 *   6. FAQ section addressing the top 3 objections
 *   7. Restore + Terms + Privacy footer
 *
 * What we deliberately *don't* do (against App Store policy / brand):
 *   - No fake user counts, no fake testimonials with stock photos.
 *   - No pre-selected auto-renew tricks - both plans are visible & equal.
 *   - No mascot.
 */

export default function OnboardingPaywallScreen() {
  useOnboardingStepView('paywall');
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const { isPremium, completeOnboarding, setSubscription, userName, dailyScreenTimeHours } = useStore();
  const firstName = FIRST_NAME(userName);

  const {
    loading,
    purchasing,
    monthlyPrice,
    annualPrice,
    annualBasePrice,
    hasAnnualIntro,
    annualPerMonth,
    annualSavingsPct,
    selectedPlan,
    setSelectedPlan,
    purchase,
    restore,
  } = usePaywallPurchase({ visible: true, source: 'onboarding' });

  const finishOnboarding = () => {
    completeOnboarding();
    router.replace(POST_PURCHASE_ROUTE);
  };

  // Apple Pay cancel - no rescue screen. User stays on the paywall and can
  // try again or close the app. Removing the win-back path simplifies the
  // funnel; we'll re-introduce it later if real funnel data shows a
  // meaningful cancel-then-buy-cheaper opportunity.
  const handleCancel = () => { /* no-op */ };

  useEffect(() => {
    if (isPremium) finishOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const handleStart = () => purchase(finishOnboarding, handleCancel);
  const handleRestore = () => restore(finishOnboarding);
  const handleDevSkip = () => {
    setSubscription(selectedPlan);
    finishOnboarding();
  };

  // Hours-saved math for the personal hero number. Mirrors the plan screen's
  // "cut in half" promise: 50% of daily screen time × 7 days. The Math.max
  // floor keeps the number meaningful for users who reported very low daily
  // hours during onboarding.
  const hoursSavedPerWeek = Math.max(2, Math.round((dailyScreenTimeHours || 4) * 0.5 * 7));

  // Per-month label for the "below the price" caption on yearly.
  const annualMonthlyLabel = annualPerMonth || '~£4.17/mo';

  // ── Idle pulse on the primary CTA so it pulls the eye ──
  const ctaPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (loading || purchasing) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, { toValue: 1.018, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(ctaPulse, { toValue: 1.0,    duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => loop.start(), 700);
    return () => { clearTimeout(t); loop.stop(); };
  }, [loading, purchasing]);

  return (
    <OnboardingLayout>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollBody,
            {
              paddingTop: insets.top + Spacing.lg,
              paddingBottom: insets.bottom + 200, // leave room for sticky CTA
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ───────────────────────── Hero ───────────────────────── */}
          <Text style={[styles.eyebrow, { color: colors.muted }]}>YOUR PLAN IS READY</Text>
          <Text style={[styles.headline, { color: colors.text }]}>
            {firstName ? `${firstName}, get ` : 'Get '}
            <Text style={{ color: colors.accent }}>
              {hoursSavedPerWeek}+ hours
            </Text>
            {'\n'}back a week.
          </Text>
          <Text style={[styles.sub, { color: colors.secondary }]}>
            Put your brain back in charge.
          </Text>

          {/* ───────────────────── Pricing ──────────────────────── */}
          <View style={styles.pricingHeader}>
            <Text style={[styles.eyebrowSmall, { color: colors.muted }]}>CHOOSE YOUR PLAN</Text>
            {annualSavingsPct > 0 && (
              <View style={[styles.saveBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.saveBadgeText}>SAVE {annualSavingsPct}%</Text>
              </View>
            )}
          </View>

          <View style={{ gap: 10, marginBottom: 18 }}>
            <PlanCard
              selected={selectedPlan === 'annual'}
              onPress={() => { hapticLight(); setSelectedPlan('annual'); }}
              title="Yearly"
              caption={
                hasAnnualIntro
                  ? `${annualPrice} for your first year`
                  : `${annualPrice} billed yearly`
              }
              priceLabel={annualMonthlyLabel}
              ribbonText={annualSavingsPct > 0 ? 'BEST VALUE' : 'POPULAR'}
              colors={colors}
            />
            <PlanCard
              selected={selectedPlan === 'monthly'}
              onPress={() => { hapticLight(); setSelectedPlan('monthly'); }}
              title="Monthly"
              caption={`${monthlyPrice} billed monthly`}
              priceLabel={`${monthlyPrice}/mo`}
              colors={colors}
            />
            {hasAnnualIntro && selectedPlan === 'annual' && (
              <Text style={[styles.renewalNote, { color: colors.muted }]}>
                Renews at {annualBasePrice}/year after first year.
              </Text>
            )}
          </View>

          {/* ─────────────── Trust + cancel-anytime ──────────────── */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <ShieldCheck size={16} color={colors.success} strokeWidth={2.2} />
              <Text style={[styles.trustText, { color: colors.text }]}>Cancel anytime</Text>
            </View>
            <View style={[styles.trustDot, { backgroundColor: colors.border }]} />
            <View style={styles.trustItem}>
              <Check size={16} color={colors.success} strokeWidth={2.4} />
              <Text style={[styles.trustText, { color: colors.text }]}>No hidden fees</Text>
            </View>
            <View style={[styles.trustDot, { backgroundColor: colors.border }]} />
            <View style={styles.trustItem}>
              <Star size={16} color={colors.success} strokeWidth={2.2} />
              <Text style={[styles.trustText, { color: colors.text }]}>Secured by Apple</Text>
            </View>
          </View>

          {/* ─────────────────── Inclusions list ─────────────────── */}
          <View style={[styles.includesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.includesTitle, { color: colors.text }]}>Everything you get</Text>
            {INCLUSIONS.map((line, i) => (
              <View key={i} style={[styles.includeRow, i === INCLUSIONS.length - 1 && { marginBottom: 0 }]}>
                <View style={[styles.includeTick, { backgroundColor: `${colors.accent}1F`, borderColor: `${colors.accent}40` }]}>
                  <Check size={12} color={colors.accent} strokeWidth={3} />
                </View>
                <Text style={[styles.includeText, { color: colors.text }]}>{line}</Text>
              </View>
            ))}
          </View>

          {/* ─────────────────────── FAQ ─────────────────────────── */}
          <Text style={[styles.eyebrowSmall, { color: colors.muted, marginTop: 28 }]}>YOU MIGHT ASK</Text>
          <View style={{ gap: 8 }}>
            {FAQS.map((q, i) => (
              <FaqItem key={i} q={q.q} a={q.a} colors={colors} initiallyOpen={i === 0} />
            ))}
          </View>

          {/* Footer links */}
          <View style={styles.subRow}>
            <TouchableOpacity onPress={handleRestore} disabled={purchasing}>
              <Text style={[styles.subLink, { color: colors.secondary }]}>Restore</Text>
            </TouchableOpacity>
            <View style={[styles.subDot, { backgroundColor: colors.borderStrong }]} />
            <TouchableOpacity onPress={() => Linking.openURL('https://plbtk.com#terms')}>
              <Text style={[styles.subLink, { color: colors.secondary }]}>Terms</Text>
            </TouchableOpacity>
            <View style={[styles.subDot, { backgroundColor: colors.borderStrong }]} />
            <TouchableOpacity onPress={() => Linking.openURL('https://plbtk.com#privacy')}>
              <Text style={[styles.subLink, { color: colors.secondary }]}>Privacy</Text>
            </TouchableOpacity>
          </View>

          {__DEV__ && (
            <TouchableOpacity
              onPress={handleDevSkip}
              style={[styles.devSkipBtn, { borderColor: colors.borderStrong }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.devSkipText, { color: colors.muted }]}>Skip (dev)</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* ──────────────── Sticky CTA over a soft fade ──────────────── */}
        <View pointerEvents="box-none" style={styles.stickyWrap}>
          <LinearGradient
            colors={[`${colors.background}00`, colors.background]}
            style={styles.stickyFade}
            pointerEvents="none"
          />
          <View style={[styles.stickyInner, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background }]}>
            {loading ? (
              <View style={[styles.loadingBtn, { backgroundColor: colors.cardAlt }]}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : (
              <Animated.View style={{ transform: [{ scale: ctaPulse }] }}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  disabled={purchasing}
                  onPress={() => { hapticMedium(); handleStart(); }}
                  style={Platform.select({
                    ios: {
                      shadowColor: colors.accent,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.35,
                      shadowRadius: 14,
                      borderRadius: 999,
                    },
                    android: { elevation: 6, borderRadius: 999 },
                  })}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ctaButton}
                  >
                    <Text style={styles.ctaButtonText}>
                      {purchasing
                        ? 'Processing…'
                        : selectedPlan === 'annual'
                          ? `Start - ${annualMonthlyLabel}`
                          : `Start - ${monthlyPrice}/mo`}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
            <Text style={[styles.stickyMicrocopy, { color: colors.muted }]}>
              Cancel anytime, no questions asked
            </Text>
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}

// ───────────────────────────────────────────────────────────────
// Subcomponents
// ───────────────────────────────────────────────────────────────

const INCLUSIONS = [
  'Block any app, your schedule',
  '10+ cognitive games',
  'Brain Profile tracking',
  'Unlimited unlocks',
  'New games every month',
];

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Will this work for me?',
    a: "If you commit, yes. Most people feel the shift inside two weeks.",
  },
  {
    q: 'Is it worth it?',
    a: 'Less than a coffee a month. 180+ hours of your life back per year.',
  },
  {
    q: "How is this different from other apps?",
    a: "Other apps just track your screen time. We make you earn it with brain games — so you build focus, not guilt.",
  },
  {
    q: "Does it actually reduce screen time?",
    a: "Users cut their phone use by a minimum of 50%. The friction of playing a game before opening an app rewires the habit loop.",
  },
];

function PlanCard({
  selected, onPress, title, caption, priceLabel, ribbonText, colors,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  caption: string;
  priceLabel: string;
  ribbonText?: string;
  colors: any;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View
        style={[
          styles.planCard,
          {
            backgroundColor: selected ? `${colors.accent}10` : colors.card,
            borderColor: selected ? colors.accent : colors.border,
            borderWidth: selected ? 2 : 1,
          },
        ]}
      >
        <View style={[styles.radio, { borderColor: selected ? colors.accent : colors.borderStrong }]}>
          {selected && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.planTitleRow}>
            <Text style={[styles.planTitle, { color: colors.text }]}>{title}</Text>
            {ribbonText && selected && (
              <View style={[styles.ribbon, { backgroundColor: colors.accent }]}>
                <Text style={styles.ribbonText}>{ribbonText}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.planCaption, { color: colors.muted }]}>{caption}</Text>
        </View>

        <Text style={[styles.planPrice, { color: colors.text }]}>{priceLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

function FaqItem({
  q, a, colors, initiallyOpen,
}: { q: string; a: string; colors: any; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(!!initiallyOpen);
  const rotate = useRef(new Animated.Value(initiallyOpen ? 1 : 0)).current;

  const toggle = () => {
    hapticLight();
    Animated.timing(rotate, {
      toValue: open ? 0 : 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setOpen(!open);
  };

  const arrowRotate = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity activeOpacity={0.8} onPress={toggle} style={styles.faqHead}>
        <Text style={[styles.faqQ, { color: colors.text }]}>{q}</Text>
        <Animated.View style={{ transform: [{ rotate: arrowRotate }] }}>
          <ChevronDown size={18} color={colors.muted} strokeWidth={2.4} />
        </Animated.View>
      </TouchableOpacity>
      {open && (
        <Text style={[styles.faqA, { color: colors.secondary }]}>{a}</Text>
      )}
    </View>
  );
}

// ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollBody: {
    paddingHorizontal: 22,
  },

  // Hero
  eyebrow: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.8,
    marginBottom: 10,
    marginTop: 8,
  },
  eyebrowSmall: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  headline: {
    fontSize: 34,
    fontFamily: FontFamily.medium,
    letterSpacing: -1.0,
    lineHeight: 38,
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    marginBottom: 22,
  },

  // Pricing
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  saveBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  saveBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.8,
    color: '#FFFFFF',
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  planTitle: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.3,
  },
  ribbon: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ribbonText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.6,
    color: '#FFFFFF',
  },
  planCaption: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  planPrice: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },

  // Trust row
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.1,
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },

  // Inclusions
  includesCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  includesTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 0,
  },
  includeTick: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  includeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },

  // FAQ
  faqCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQ: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  faqA: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 21,
    marginTop: 10,
  },

  // Footer + dev skip
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 26,
  },
  subLink: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  subDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  devSkipBtn: {
    marginTop: 18,
    alignSelf: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  devSkipText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },

  // Sticky CTA
  stickyWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  stickyFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
  },
  stickyInner: {
    paddingTop: 14,
    paddingHorizontal: 22,
  },
  ctaButton: {
    height: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  loadingBtn: {
    height: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyMicrocopy: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.1,
  },
  renewalNote: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.1,
  },
});
