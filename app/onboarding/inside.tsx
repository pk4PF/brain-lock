import { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Brain, Trophy, Coins } from 'lucide-react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { Eyebrow, PillButton } from '../../src/components/ui/anvil';
import {
  InstagramLogo, TikTokLogo, YouTubeLogo, RedditLogo, XLogo, SnapchatLogo,
} from '../../src/components/onboarding/BrandLogos';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

/**
 * "What's inside" - 5-page swipeable preview matching the howitworks flow.
 *
 * Slots after the currency explainer (howitworks) and before the demos.
 * Pages, in order:
 *   1. Block               - apps you'll lock
 *   2. Train your brain    - Brain Profile / cognitive scores
 *   3. Earn brain cells    - Home cells balance
 *   4. Spend cells         - apps unlocked
 *   5. The outcome         - "Your brain, back in charge."
 *
 * Each step has a single big headline + one mockup visual. No subheadings,
 * no body prose. The step number (eyebrow) labels, the visual explains.
 */

const { width: SW } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Page 1: locked apps grid (the "Block" tab preview)
// ─────────────────────────────────────────────────────────────
function BlockingPreviewVisual() {
  const { colors } = useThemeColors();
  const apps = [
    { Logo: InstagramLogo, bg: '#F58529' },
    { Logo: TikTokLogo,    bg: '#000000' },
    { Logo: YouTubeLogo,   bg: '#FF0000' },
    { Logo: RedditLogo,    bg: '#FF4500' },
    { Logo: XLogo,         bg: '#000000' },
    { Logo: SnapchatLogo,  bg: '#FFFC00' },
  ];
  return (
    <View style={[mockup.frame, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={mockup.appsGrid}>
        {apps.map(({ Logo, bg }, i) => (
          <View key={i} style={[mockup.appCell, { backgroundColor: bg }]}>
            <Logo size={28} />
          </View>
        ))}
      </View>
      <View style={[mockup.frameStatusBar, { borderTopColor: colors.border, backgroundColor: colors.cardAlt }]}>
        <View style={[mockup.statusDot, { backgroundColor: colors.accent }]} />
        <Text style={[mockup.statusText, { color: colors.text }]}>
          Locked
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Page 2: Brain Profile / cognitive scores - the "you get smarter" reveal.
// Mirrors the Stats tab visual: 5 horizontal bars, one per cognitive area,
// each in its own game accent hue. The pcts shown are illustrative — fast
// enough to read as "this is what your brain looks like trained."
// ─────────────────────────────────────────────────────────────
function BrainProfileVisual() {
  const { colors } = useThemeColors();
  const attrs = [
    { label: 'Memory',          pct: 0.78, hue: GameAccents.memory.hue },
    { label: 'Recall',          pct: 0.62, hue: GameAccents['word-recall'].hue },
    { label: 'Attention',       pct: 0.71, hue: GameAccents.focus.hue },
    { label: 'Speed',           pct: 0.84, hue: GameAccents.reaction.hue },
    { label: 'Problem Solving', pct: 0.55, hue: GameAccents.math.hue },
  ];
  return (
    <View style={[mockup.frame, { borderColor: colors.border, backgroundColor: colors.card, paddingVertical: 14 }]}>
      <View style={mockup.profileHeader}>
        <View style={mockup.profileLeft}>
          <View style={[mockup.profileIconBadge, { backgroundColor: `${colors.accent}1F`, borderColor: `${colors.accent}40` }]}>
            <Brain size={14} color={colors.accent} strokeWidth={2.2} />
          </View>
          <Text style={[mockup.profileBig, { color: colors.accent }]}>70</Text>
        </View>
        <Text style={[mockup.profileLabel, { color: colors.muted }]}>OVERALL</Text>
      </View>
      <View style={mockup.attrList}>
        {attrs.map((a, i) => (
          <View key={i} style={mockup.attrRow}>
            <Text style={[mockup.attrLabel, { color: colors.text }]}>{a.label}</Text>
            <View style={[mockup.attrTrack, { backgroundColor: colors.cardAlt }]}>
              <View style={[mockup.attrFill, { width: `${a.pct * 100}%` as any, backgroundColor: a.hue }]} />
            </View>
            <Text style={[mockup.attrScore, { color: a.hue }]}>{Math.round(a.pct * 100)}</Text>
          </View>
        ))}
      </View>
      <View style={[mockup.frameStatusBar, { borderTopColor: colors.border, backgroundColor: colors.cardAlt }]}>
        <View style={[mockup.statusDot, { backgroundColor: colors.accent }]} />
        <Text style={[mockup.statusText, { color: colors.text }]}>
          Get sharper every day
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Page 3: Brain Cells balance - the Home cells card mocked up. Shows the
// currency the user earns by training. Status bar reinforces the loop.
// ─────────────────────────────────────────────────────────────
function EarnCellsVisual() {
  const { colors } = useThemeColors();
  const balance = 47;
  const target = 100;
  const pct = balance / target;
  return (
    <View style={[mockup.frame, { borderColor: colors.border, backgroundColor: colors.card, paddingVertical: 18 }]}>
      <View style={mockup.cellsHeader}>
        <View style={[mockup.cellsIconBadge, { backgroundColor: `${colors.accent}1F`, borderColor: `${colors.accent}40` }]}>
          <Coins size={16} color={colors.accent} strokeWidth={2.2} />
        </View>
        <Text style={[mockup.cellsTitle, { color: colors.text }]}>Brain Cells</Text>
        <Text style={[mockup.cellsCount, { color: colors.muted }]}>
          {balance} / {target}
        </Text>
      </View>
      <View style={[mockup.cellsTrack, { backgroundColor: colors.border }]}>
        <View style={[mockup.cellsFill, { width: `${pct * 100}%` as any, backgroundColor: colors.accent }]} />
      </View>
      <View style={mockup.cellsCaptionRow}>
        <Text style={[mockup.cellsCaption, { color: colors.muted }]}>+5 cells per game</Text>
      </View>
      <View style={[mockup.frameStatusBar, { borderTopColor: colors.border, backgroundColor: colors.cardAlt, marginTop: 8 }]}>
        <View style={[mockup.statusDot, { backgroundColor: colors.accent }]} />
        <Text style={[mockup.statusText, { color: colors.text }]}>
          1 cell = 1 minute
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Page 3: same apps as page 1, but unlocked. Reusing the grid is
// deliberate — the visual hand-off (locked → trained → unlocked) is
// stronger when it's the *same surface* changing state, not a new
// screen.
// ─────────────────────────────────────────────────────────────
function UnlockPreviewVisual() {
  const { colors } = useThemeColors();
  const apps = [
    { Logo: InstagramLogo, bg: '#F58529' },
    { Logo: TikTokLogo,    bg: '#000000' },
    { Logo: YouTubeLogo,   bg: '#FF0000' },
    { Logo: RedditLogo,    bg: '#FF4500' },
    { Logo: XLogo,         bg: '#000000' },
    { Logo: SnapchatLogo,  bg: '#FFFC00' },
  ];
  return (
    <View style={[mockup.frame, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={mockup.appsGrid}>
        {apps.map(({ Logo, bg }, i) => (
          <View
            key={i}
            style={[mockup.appCell, { backgroundColor: bg, opacity: 1 }]}
          >
            <Logo size={28} />
          </View>
        ))}
      </View>
      <View style={[mockup.frameStatusBar, { borderTopColor: colors.border, backgroundColor: colors.cardAlt }]}>
        <View style={[mockup.statusDot, { backgroundColor: colors.success }]} />
        <Text style={[mockup.statusText, { color: colors.text }]}>
          Unlocked  ·  18 mins left
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Page 5: outcome card — the destination, not another step. Solid accent
// fill so it reads visually distinct from steps 1-4. Mirrors the outcome
// card in howitworks.tsx so the two screens close on the same beat.
// ─────────────────────────────────────────────────────────────
function OutcomeVisual() {
  const { colors } = useThemeColors();
  return (
    <View style={[mockup.frame, { borderColor: colors.accent, backgroundColor: colors.accent, padding: 24, alignItems: 'center', justifyContent: 'center', minHeight: 240 }]}>
      <View style={mockup.outcomeIconLarge}>
        <Trophy size={42} color="#FFFFFF" strokeWidth={2} />
      </View>
      <Text style={mockup.outcomeLabel}>YOU GET</Text>
      <Text style={mockup.outcomeBig}>Your brain,{'\n'}back in charge.</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Pages
// ─────────────────────────────────────────────────────────────

interface Page {
  step: string;
  headline: string;
  Visual: React.ComponentType;
}

// One headline per step. Step number does the labelling work, the visual
// does the explaining work — so the body copy is dropped entirely.
const PAGES: Page[] = [
  {
    step: 'Step 1',
    headline: 'Lock the apps that drain you.',
    Visual: BlockingPreviewVisual,
  },
  {
    step: 'Step 2',
    headline: 'Train your brain. Get smarter.',
    Visual: BrainProfileVisual,
  },
  {
    step: 'Step 3',
    headline: 'Earn brain cells.',
    Visual: EarnCellsVisual,
  },
  {
    step: 'Step 4',
    headline: 'Spend braincells to unlock apps.',
    Visual: UnlockPreviewVisual,
  },
  {
    step: 'Step 5',
    headline: 'Your brain, back in charge.',
    Visual: OutcomeVisual,
  },
];

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function InsideScreen() {
  useOnboardingStepView('inside');
  const { colors } = useThemeColors();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const pages = PAGES;

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SW);
    if (next !== page) setPage(next);
  };

  const handlePrimary = () => {
    if (page < pages.length - 1) {
      scrollRef.current?.scrollTo({ x: SW * (page + 1), animated: true });
    } else {
      router.push('/onboarding/demo-block');
    }
  };

  const isLast = page === pages.length - 1;

  return (
    <OnboardingLayout step={7}>
      <OnboardingBackButton />
      <View style={styles.content}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          style={styles.scroll}
        >
          {pages.map(({ step, headline, Visual }, i) => (
            <View key={i} style={[styles.page, { width: SW }]}>
              <View style={styles.visualWrap}>
                <FadeUp delay={i === 0 ? 60 : 0}>
                  <Visual />
                </FadeUp>
              </View>

              <View style={styles.copyWrap}>
                <Eyebrow style={{ marginBottom: 8 }}>{step}</Eyebrow>
                <Text style={[styles.headline, { color: colors.text }]}>
                  {headline}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {pages.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: page === i ? colors.text : colors.border,
                  width: page === i ? 18 : 6,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.bottomContainer}>
          <PillButton
            label={isLast ? 'Try it' : 'Next'}
            onPress={handlePrimary}
            fullWidth
          />
        </View>
      </View>
    </OnboardingLayout>
  );
}

// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  scroll: { flex: 1 },
  page: {
    flex: 1,
    paddingTop: 84,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
  },
  visualWrap: { alignItems: 'center', marginBottom: 32 },
  copyWrap: { paddingHorizontal: 4 },
  headline: {
    fontSize: 32,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 12,
  },
  body: {
    fontSize: 17,
    fontFamily: FontFamily.regular,
    lineHeight: 25,
  },

  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 18,
  },
  dot: { height: 6, borderRadius: 3 },

  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
  },
});

// Mockup styles (frames + per-page widgets)
const mockup = StyleSheet.create({
  frame: {
    width: 296,
    minHeight: 240,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  frameStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },

  // Page 1: locked apps grid
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 18,
    justifyContent: 'center',
  },
  appCell: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    opacity: 0.5,
  },

  // Page 2: Brain Profile bars
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBig: {
    fontSize: 26,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  profileLabel: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.4,
  },
  attrList: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 7,
  },
  attrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attrLabel: {
    width: 100,
    fontSize: 10,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },
  attrTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  attrFill: {
    height: '100%',
    borderRadius: 3,
  },
  attrScore: {
    width: 24,
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.1,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },

  // Page 3: Brain Cells balance card
  cellsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  cellsIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellsTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  cellsCount: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.1,
    fontVariant: ['tabular-nums'],
  },
  cellsTrack: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 14,
    overflow: 'hidden',
  },
  cellsFill: {
    height: '100%',
    borderRadius: 4,
  },
  cellsCaptionRow: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  cellsCaption: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.1,
  },

  // Page 5: outcome card — solid accent fill, big trophy + headline
  outcomeIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  outcomeLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 6,
  },
  outcomeBig: {
    fontSize: 26,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.6,
    lineHeight: 32,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
