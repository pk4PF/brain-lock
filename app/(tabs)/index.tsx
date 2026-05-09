import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle2, Circle as CircleIcon, ChevronRight, X, Flame,
  Brain, Smartphone,
} from 'lucide-react-native';
import BrainCoinsIcon from '../../src/components/BrainCoinsIcon';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, UNLOCK_MINUTES, CELL_DISPLAY_CAPACITY } from '../../src/store/useStore';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { FadeInView } from '../../src/components/ui/AnimatedElements';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, FontSize, Spacing } from '../../src/constants/theme';
import { Eyebrow, AnvilCard } from '../../src/components/ui/anvil';
import {
  MemoryMatchIll, QuickMathIll, FocusFlashIll, ShapeRecallIll,
} from '../../src/components/games/GameIllustrations';
import WelcomeBonusModal from '../../src/components/home/WelcomeBonusModal';
import StreakDetailModal from '../../src/components/home/StreakDetailModal';
import SpendCellsModal from '../../src/components/home/SpendCellsModal';
import LottieIcon from '../../src/components/LottieIcon';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function useUnlockCountdown(unlockExpiresAt: number | null, appsUnlocked: boolean) {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!appsUnlocked || !unlockExpiresAt) {
      setRemainingMs(0);
      return;
    }
    const tick = () => setRemainingMs(Math.max(0, unlockExpiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [unlockExpiresAt, appsUnlocked]);

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  return { remainingMs, minutes, formatted };
}

// ─────────────────────────────────────────────────────────────
// Brain Cells progress (or unlock countdown when active)
// ─────────────────────────────────────────────────────────────

function BrainCellsCard({
  credits,
  appsUnlocked,
  unlockExpiresAt,
  unlockTotalMs,
  onTimerExpired,
}: {
  credits: number;
  appsUnlocked: boolean;
  unlockExpiresAt: number | null;
  unlockTotalMs: number | null;
  onTimerExpired: () => void;
}) {
  const { colors } = useThemeColors();
  const { formatted, remainingMs } = useUnlockCountdown(unlockExpiresAt, appsUnlocked);

  // The store polls checkUnlockExpiry every 30s - too coarse for the visible
  // countdown. Fire it immediately when the on-screen timer hits zero so the
  // UI flips to the locked state without a stale "0:00" gap.
  useEffect(() => {
    if (appsUnlocked && unlockExpiresAt && remainingMs === 0) {
      onTimerExpired();
    }
  }, [appsUnlocked, unlockExpiresAt, remainingMs, onTimerExpired]);

  // Show the unlocked card only while there's still time on the clock.
  // Once it hits zero, fall through to the locked progress bar even before
  // the store has caught up, so the user never sees a stuck "0:00".
  if (appsUnlocked && unlockExpiresAt && remainingMs > 0) {
    // Variable-length unlocks: prefer the stored session total; fall back to
    // the legacy 20-min default for any in-flight unlock from before the
    // unlockTotalMs field existed (migrating users mid-session).
    const totalMs = unlockTotalMs ?? UNLOCK_MINUTES * 60 * 1000;
    const pct = Math.max(0, Math.min(1, remainingMs / totalMs));
    return (
      <AnvilCard padding="md">
        <View style={styles.cellsHeader}>
          <View style={styles.cellsIcon}>
            <Smartphone size={18} color={colors.success} strokeWidth={2.2} />
          </View>
          <Text style={[styles.cellsTitle, { color: colors.text }]}>Apps unlocked</Text>
          <Text style={[styles.cellsCount, { color: colors.success }]}>{formatted}</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.success, width: `${pct * 100}%` },
            ]}
          />
        </View>
      </AnvilCard>
    );
  }

  // The bar fills toward a 100-cell display capacity. Earning isn't actually
  // capped - we just stop growing the visual past 100 so a stocked-up user
  // doesn't see infinite progress. "Ready" now means any cell at all, since
  // the user can spend as little as 1 cell for 1 minute.
  const target = CELL_DISPLAY_CAPACITY;
  const displayCredits = Math.min(credits, target);
  const pct = Math.max(0, Math.min(1, displayCredits / target));
  const ready = credits >= 1;

  return (
    <AnvilCard padding="md">
      <View style={styles.cellsHeader}>
        {/* Brain coins icon — gold-coin stack with brain face. Brain Cells
            are spendable currency, and the custom illustration sells that
            harder than a generic coin glyph. Brand presence stays at the
            top brand row so we don't double up the BrainLock logo. */}
        <BrainCoinsIcon size={32} />
        <Text style={[styles.cellsTitle, { color: colors.text }]}>Brain Cells</Text>
        <Text style={[styles.cellsCount, { color: colors.muted }]}>
          {credits} / {target}
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: ready ? colors.success : colors.accent, width: `${pct * 100}%` },
          ]}
        />
      </View>
    </AnvilCard>
  );
}

// ─────────────────────────────────────────────────────────────
// Train / Scroll two-button row
// ─────────────────────────────────────────────────────────────

function ActionPair({
  canUnlock,
  appsUnlocked,
  creditsNeeded,
  onTrain,
  onScroll,
}: {
  canUnlock: boolean;
  appsUnlocked: boolean;
  creditsNeeded: number;
  onTrain: () => void;
  onScroll: () => void;
}) {
  const { colors } = useThemeColors();
  const scrollDisabled = !canUnlock || appsUnlocked;
  const scrollLabel = appsUnlocked ? 'Unlocked' : 'Scroll';
  const scrollSub = appsUnlocked
    ? 'session running'
    : canUnlock
      ? 'choose duration'
      : 'earn 1 cell first';

  return (
    <View style={styles.actionRow}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onTrain}
        style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.actionIconWrap, { backgroundColor: `${colors.accent}15` }]}>
          <Brain size={28} color={colors.accent} strokeWidth={2} />
        </View>
        <Text style={[styles.actionLabel, { color: colors.text }]}>Train</Text>
        <Text style={[styles.actionSub, { color: colors.muted }]}>earn cells</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onScroll}
        disabled={scrollDisabled}
        style={[
          styles.actionCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            opacity: scrollDisabled ? 0.55 : 1,
          },
        ]}
      >
        {!scrollDisabled ? (
          <LinearGradient
            colors={[`${colors.accent}25`, `${colors.accent}05`]}
            style={styles.actionIconWrap}
          >
            <Smartphone size={28} color={colors.accent} strokeWidth={2} />
          </LinearGradient>
        ) : (
          <View style={[styles.actionIconWrap, { backgroundColor: `${colors.muted}15` }]}>
            <Smartphone size={28} color={colors.muted} strokeWidth={2} />
          </View>
        )}
        <Text style={[styles.actionLabel, { color: scrollDisabled ? colors.muted : colors.text }]}>
          {scrollLabel}
        </Text>
        <Text style={[styles.actionSub, { color: colors.muted }]}>{scrollSub}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Quick play tile row (4 + see all)
// ─────────────────────────────────────────────────────────────

const { width: SW } = Dimensions.get('window');
const QUICK_GAP = 10;
const QUICK_SIDE_PAD = Spacing.xl;
const QUICK_COLS = 4;
const QUICK_TILE_W = Math.floor((SW - QUICK_SIDE_PAD * 2 - QUICK_GAP * (QUICK_COLS - 1)) / QUICK_COLS);

// Quick Play row leads with Memory Tiles - the hero marketing game. The
// other three are kept varied across cognitive areas (memory pair-match,
// problem solving, attention) so the row feels like a sample of the app.
const QUICK_GAMES = [
  { key: 'tile-recall', title: 'Tiles',  hue: '#0EA5A5', Ill: ShapeRecallIll, route: '/games/tile-recall' },
  { key: 'memory',      title: 'Memory', hue: '#8B5CF6', Ill: MemoryMatchIll, route: '/games/memory' },
  { key: 'math',        title: 'Math',   hue: '#F97316', Ill: QuickMathIll,   route: '/games/math' },
  { key: 'focus',       title: 'Focus',  hue: '#3B82F6', Ill: FocusFlashIll,  route: '/games/focus' },
] as const;

function QuickPlay() {
  const { colors } = useThemeColors();

  return (
    <View style={{ marginTop: Spacing.xl }}>
      <View style={styles.sectionLabelRow}>
        <Eyebrow style={{ marginBottom: 0 }}>Quick play</Eyebrow>
        <TouchableOpacity
          onPress={() => { hapticLight(); router.push('/(tabs)/games'); }}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.seeAll, { color: colors.secondary }]}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.quickRow}>
        {QUICK_GAMES.map((game) => {
          const Ill = game.Ill;
          return (
            <TouchableOpacity
              key={game.key}
              activeOpacity={0.75}
              onPress={() => { hapticLight(); router.push(game.route as any); }}
              style={[
                styles.quickTile,
                {
                  width: QUICK_TILE_W,
                  height: QUICK_TILE_W * 1.15,
                  backgroundColor: `${game.hue}10`,
                  borderColor: `${game.hue}30`,
                },
              ]}
            >
              <View style={styles.quickIll}>
                <Ill size={Math.round(QUICK_TILE_W * 0.55)} />
              </View>
              <Text
                style={[styles.quickTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {game.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Setup checklist (only while incomplete)
// ─────────────────────────────────────────────────────────────

function SetupChecklist() {
  const {
    progress,
    settings,
    dailyEarnTasksCompleted,
    setupGuideComplete,
    completeSetupGuide,
  } = useStore();
  const { colors } = useThemeColors();

  const isBlocking = settings.screenTimeAppCount > 0;

  const steps = [
    {
      title: 'Play a game',
      description: 'Earn your first brain cell',
      done: progress.gamesPlayed > 0 || dailyEarnTasksCompleted > 0,
      onPress: () => { hapticLight(); router.push('/(tabs)/games'); },
    },
    {
      title: 'Pick your apps',
      description: 'Choose what to block',
      done: isBlocking,
      onPress: () => { hapticLight(); router.push('/(tabs)/lock'); },
    },
    {
      title: 'Spend cells to unlock',
      description: '1 cell = 1 minute of apps. Spend as much as you want.',
      done: isBlocking && dailyEarnTasksCompleted >= settings.challengesRequired,
      onPress: () => { hapticLight(); router.push('/(tabs)/lock'); },
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  useEffect(() => {
    if (allDone && !setupGuideComplete) completeSetupGuide();
  }, [allDone, setupGuideComplete]);

  if (setupGuideComplete) return null;

  return (
    <View style={{ marginTop: Spacing.xl }}>
      <View style={styles.sectionLabelRow}>
        <Eyebrow style={{ marginBottom: 0 }}>Get started</Eyebrow>
        <Text style={[styles.sectionCount, { color: colors.muted }]}>
          {completedCount} / {steps.length}
        </Text>
      </View>

      <AnvilCard padding="md">
        {steps.map((step, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.6}
            onPress={step.done ? undefined : step.onPress}
            disabled={step.done}
            style={[
              styles.checklistRow,
              i < steps.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            {step.done
              ? <CheckCircle2 size={20} color={colors.success} fill={`${colors.success}25`} strokeWidth={2} />
              : <CircleIcon size={20} color={colors.border} strokeWidth={1.5} />}

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.checklistTitle,
                  {
                    color: step.done ? colors.muted : colors.text,
                    textDecorationLine: step.done ? 'line-through' : 'none',
                  },
                ]}
              >
                {step.title}
              </Text>
              <Text style={[styles.checklistDesc, { color: colors.muted }]}>
                {step.description}
              </Text>
            </View>

            {!step.done && <ChevronRight size={16} color={colors.muted} strokeWidth={2} />}
          </TouchableOpacity>
        ))}
      </AnvilCard>

      <TouchableOpacity
        onPress={() => { hapticLight(); completeSetupGuide(); }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.dismissRow}
      >
        <X size={13} color={colors.muted} strokeWidth={2} />
        <Text style={[styles.dismissText, { color: colors.muted }]}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const {
    progress, appsUnlocked, credits, unlockExpiresAt, unlockTotalMs,
    spendCredits, checkUnlockExpiry,
    onboardingComplete, welcomeBonusClaimed, claimWelcomeBonus,
  } = useStore();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  // Welcome-bonus modal - auto-shown the first time a freshly-onboarded
  // user lands on Home. Gated by both flags so existing users (migrated to
  // welcomeBonusClaimed:true in store v9) never see it retroactively.
  const showWelcomeBonus = onboardingComplete && !welcomeBonusClaimed;

  // Streak detail sheet - opened by tapping the streak chip top-right.
  const [streakOpen, setStreakOpen] = useState(false);
  // Spend Cells sheet - opened by tapping "Scroll" on the action pair.
  const [spendOpen, setSpendOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(checkUnlockExpiry, 30000);
    return () => clearInterval(id);
  }, [checkUnlockExpiry]);

  // The Scroll button is enabled as soon as the user has any cell - the
  // sheet then surfaces tier-by-tier affordability.
  const canUnlock = credits >= 1;
  const creditsNeeded = Math.max(0, 1 - credits);

  const handleTrain = () => {
    hapticLight();
    router.push('/(tabs)/games');
  };

  const handleScroll = () => {
    if (!canUnlock || appsUnlocked) return;
    hapticLight();
    setSpendOpen(true);
    track(Events.UnlockAttempted, { credits_available: credits, source: 'home' });
  };

  const handleConfirmSpend = (amount: number) => {
    hapticMedium();
    const ok = spendCredits(amount);
    setSpendOpen(false);
    if (ok) {
      track('unlock_purchased', { amount, minutes: amount, balance_after: credits - amount });
    }
  };

  const handleClaimBonus = () => {
    hapticMedium();
    claimWelcomeBonus();
    track('welcome_bonus_claimed', { amount: 30 });
  };

  const handleOpenStreak = () => {
    hapticLight();
    setStreakOpen(true);
    track('streak_detail_opened', { current_streak: progress.currentStreak });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxxl,
          paddingHorizontal: Spacing.xl,
        }}
      >
        {/* Brand row */}
        <FadeInView delay={0}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.brand, { color: colors.text }]}>BrainLock</Text>
              <Text style={[styles.tagline, { color: colors.muted }]}>brain back in charge</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenStreak}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.streakChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Flame size={14} color={colors.accent} fill={progress.currentStreak > 0 ? colors.accent : 'transparent'} strokeWidth={2.2} />
              <Text style={[styles.streakValue, { color: colors.text }]}>{progress.currentStreak}</Text>
            </TouchableOpacity>
          </View>
        </FadeInView>

        <View style={{ height: Spacing.xl }} />

        {/* Brain Cells progress / unlock countdown */}
        <FadeInView delay={60}>
          <BrainCellsCard
            credits={credits}
            appsUnlocked={appsUnlocked}
            unlockExpiresAt={unlockExpiresAt}
            unlockTotalMs={unlockTotalMs}
            onTimerExpired={checkUnlockExpiry}
          />
        </FadeInView>

        <View style={{ height: Spacing.lg }} />

        {/* Train / Scroll */}
        <FadeInView delay={120}>
          <ActionPair
            canUnlock={canUnlock}
            appsUnlocked={appsUnlocked}
            creditsNeeded={creditsNeeded}
            onTrain={handleTrain}
            onScroll={handleScroll}
          />
        </FadeInView>

        {/* Quick play */}
        <FadeInView delay={180}>
          <QuickPlay />
        </FadeInView>

        {/* Setup checklist - only while incomplete */}
        <FadeInView delay={240}>
          <SetupChecklist />
        </FadeInView>
      </ScrollView>

      {/* Modals - sit above all Home content */}
      <WelcomeBonusModal
        visible={showWelcomeBonus}
        onClaim={handleClaimBonus}
      />
      <StreakDetailModal
        visible={streakOpen}
        onClose={() => setStreakOpen(false)}
        currentStreak={progress.currentStreak}
        longestStreak={progress.longestStreak}
        weeklyPoints={progress.weeklyPoints}
      />
      <SpendCellsModal
        visible={spendOpen}
        onClose={() => setSpendOpen(false)}
        credits={credits}
        onConfirm={handleConfirmSpend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Brand row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  brand: {
    fontSize: 28,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  tagline: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    letterSpacing: 0.1,
    marginTop: 2,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  streakValue: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.1,
    fontVariant: ['tabular-nums'],
  },

  // Brain Cells card
  cellsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cellsIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellsTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  cellsCount: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.1,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  // Action pair
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 19,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.3,
  },
  actionSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    letterSpacing: 0.1,
  },

  // Section label rows (shared with games.tsx style)
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionCount: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.1,
  },

  // Quick play row
  quickRow: {
    flexDirection: 'row',
    gap: QUICK_GAP,
  },
  quickTile: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickIll: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.1,
    marginTop: 4,
  },

  // Setup checklist
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  checklistTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.1,
  },
  checklistDesc: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginTop: 3,
  },
  dismissRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  dismissText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
});
