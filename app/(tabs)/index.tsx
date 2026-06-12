import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { router } from 'expo-router';
import {
  CheckCircle2, Circle as CircleIcon, ChevronRight, X, Flame,
  Smartphone, Lock, LockOpen, Brain, Check,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { hapticLight } from '../../src/utils/haptics';
import { FadeInView } from '../../src/components/ui/AnimatedElements';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { track } from '../../src/services/analytics';
import { FontFamily, FontSize, Spacing } from '../../src/constants/theme';
import { Eyebrow, AnvilCard } from '../../src/components/ui/anvil';
import { scoreBand, getRank } from '../../src/utils/brainScore';
import { startBenchmark } from '../../src/utils/benchmark';
import { getTodaysWorkout, WORKOUT_REWARD } from '../../src/constants/workout';
import StreakDetailModal from '../../src/components/home/StreakDetailModal';

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
// Unlock status card - countdown when unlocked, "locked" otherwise
// ─────────────────────────────────────────────────────────────

function UnlockStatusCard({
  appsUnlocked,
  unlockExpiresAt,
  unlockTotalMs,
  isBlocking,
  onTimerExpired,
  onUnlock,
  onRelock,
  onBlock,
}: {
  appsUnlocked: boolean;
  unlockExpiresAt: number | null;
  unlockTotalMs: number | null;
  isBlocking: boolean;
  onTimerExpired: () => void;
  onUnlock: () => void;
  onRelock: () => void;
  onBlock: () => void;
}) {
  const { colors } = useThemeColors();
  const { formatted, remainingMs } = useUnlockCountdown(unlockExpiresAt, appsUnlocked);

  // Flip to locked the instant the visible countdown hits zero (store polls
  // coarsely, so push it along here).
  useEffect(() => {
    if (appsUnlocked && unlockExpiresAt && remainingMs === 0) onTimerExpired();
  }, [appsUnlocked, unlockExpiresAt, remainingMs, onTimerExpired]);

  if (appsUnlocked && unlockExpiresAt && remainingMs > 0) {
    const totalMs = unlockTotalMs ?? 15 * 60 * 1000;
    const pct = Math.max(0, Math.min(1, remainingMs / totalMs));
    return (
      <AnvilCard padding="md">
        <View style={styles.cellsHeader}>
          <View style={styles.cellsIcon}>
            <LockOpen size={18} color={colors.success} strokeWidth={2.2} />
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
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onRelock}
          style={[styles.relockBtn, styles.cardAction, { borderColor: colors.borderStrong, backgroundColor: colors.card }]}
        >
          <Lock size={20} color={colors.text} strokeWidth={2.2} />
          <Text style={[styles.relockBtnText, { color: colors.text }]}>Lock apps now</Text>
        </TouchableOpacity>
      </AnvilCard>
    );
  }

  // No apps chosen yet → don't claim anything is "locked".
  if (!isBlocking) {
    return (
      <AnvilCard padding="md">
        <View style={styles.cellsHeader}>
          <View style={[styles.cellsIcon, { backgroundColor: `${colors.muted}15` }]}>
            <Lock size={18} color={colors.muted} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cellsTitle, { color: colors.text }]}>No apps blocked yet</Text>
            <Text style={[styles.lockedSub, { color: colors.muted }]}>
              Choose which apps to block
            </Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onBlock}
          style={[styles.unlockBtn, styles.cardAction, { backgroundColor: colors.accent }]}
        >
          <Lock size={22} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.unlockBtnText}>Block apps</Text>
        </TouchableOpacity>
      </AnvilCard>
    );
  }

  return (
    <AnvilCard padding="md">
      <View style={styles.cellsHeader}>
        <View style={[styles.cellsIcon, { backgroundColor: `${colors.accent}15` }]}>
          <Lock size={18} color={colors.accent} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cellsTitle, { color: colors.text }]}>Apps locked</Text>
          <Text style={[styles.lockedSub, { color: colors.muted }]}>
            Unlocking them costs you Brainpower
          </Text>
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onUnlock}
        style={[styles.unlockBtn, styles.cardAction, { backgroundColor: colors.accent }]}
      >
        <LockOpen size={22} color="#FFFFFF" strokeWidth={2.4} />
        <Text style={styles.unlockBtnText}>Unlock apps</Text>
      </TouchableOpacity>
    </AnvilCard>
  );
}

// ─────────────────────────────────────────────────────────────
// Setup checklist (only while incomplete)
// ─────────────────────────────────────────────────────────────

function SetupChecklist() {
  const { progress, settings, setupGuideComplete, completeSetupGuide } = useStore();
  const { colors } = useThemeColors();

  const isBlocking = settings.screenTimeAppCount > 0;

  const steps = [
    {
      title: 'Pick your apps',
      description: 'Choose what to block',
      done: isBlocking,
      onPress: () => { hapticLight(); router.push('/(tabs)/lock'); },
    },
    {
      title: 'Train your brain',
      description: 'Play your first Brain Gym rep',
      done: progress.gamesPlayed > 0,
      onPress: () => { hapticLight(); router.push('/(tabs)/games'); },
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
    progress, settings, appsUnlocked, unlockExpiresAt, unlockTotalMs, checkUnlockExpiry, relockApps,
    brainScore, unlockApps, dailyWorkoutDone,
  } = useStore();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  const [streakOpen, setStreakOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(checkUnlockExpiry, 30000);
    return () => clearInterval(id);
  }, [checkUnlockExpiry]);

  const handleUnlock = () => {
    hapticLight();
    track('unlock_opened', { source: 'home' });
    setUnlockOpen(true);
  };

  // Pick a duration → unlock straight away. Longer = more brain rot.
  const UNLOCK_OPTIONS = [
    { mins: 15, rot: 15 },
    { mins: 30, rot: 30 },
    { mins: 60, rot: 60 },
  ];
  const confirmUnlock = (mins: number) => {
    hapticLight();
    track('unlock_confirmed', { source: 'home', minutes: mins });
    setUnlockOpen(false);
    unlockApps(mins);
  };

  const handleRelock = () => {
    hapticLight();
    track('relock_now', { source: 'home' });
    relockApps();
  };

  const handleBlock = () => {
    hapticLight();
    router.push('/(tabs)/lock');
  };

  const handleOpenStreak = () => {
    hapticLight();
    setStreakOpen(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + 120,
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
              <Text style={[styles.brand, { color: colors.text }]}>Brainlock</Text>
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

        {/* Brainpower Score - the spine of the app. Unmeasured users get the
            benchmark CTA; measured users see the live number they're managing. */}
        <FadeInView delay={30}>
          {brainScore === null ? (
            <AnvilCard padding="lg">
              <View style={styles.rotEmptyRow}>
                <View style={[styles.rotEmptyIcon, { backgroundColor: `${colors.accent}1A`, borderColor: `${colors.accent}40` }]}>
                  <Brain size={22} color={colors.accent} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rotEmptyTitle, { color: colors.text }]}>
                    What's your Brainpower Score?
                  </Text>
                  <Text style={[styles.rotEmptySub, { color: colors.muted }]}>
                    60-second benchmark sets your baseline.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => { hapticLight(); track('benchmark_opened', { source: 'home' }); startBenchmark(); }}
                style={[styles.rotBenchBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.rotBenchBtnText}>Take the benchmark</Text>
              </TouchableOpacity>
            </AnvilCard>
          ) : (
            <AnvilCard padding="lg">
              <View style={styles.rotRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rotEyebrow, { color: colors.muted }]}>BRAINPOWER SCORE</Text>
                  <Text style={[styles.rotScore, { color: colors.accent }]}>{Math.round(brainScore)}</Text>
                </View>
                <View style={[styles.rotPill, { backgroundColor: `${colors.accent}1A`, borderColor: `${colors.accent}33` }]}>
                  <Text style={[styles.rotPillText, { color: colors.accent }]}>
                    {scoreBand(brainScore).emoji} {scoreBand(brainScore).label.toUpperCase()}
                  </Text>
                </View>
              </View>
              {(() => {
                const rank = getRank(Math.round(brainScore));
                return (
                  <>
                    <View style={[styles.rotTrack, { backgroundColor: colors.cardAlt }]}>
                      <View style={[styles.rotFill, { width: `${Math.max(3, Math.round(rank.progress * 100))}%`, backgroundColor: colors.accent }]} />
                    </View>
                    <Text style={[styles.rankToNext, { color: colors.muted }]}>
                      {rank.isMax ? 'Top rank reached' : `${rank.toNext} pts to ${rank.nextEmoji} ${rank.nextName}`}
                    </Text>
                  </>
                );
              })()}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => { hapticLight(); router.push('/(tabs)/games'); }}
                style={styles.rotGymLink}
              >
                <Text style={[styles.rotGymText, { color: colors.accent }]}>Raise it in the Brain Gym</Text>
                <ChevronRight size={16} color={colors.accent} strokeWidth={2.4} />
              </TouchableOpacity>
            </AnvilCard>
          )}
        </FadeInView>

        {/* Today's Brain Workout - prescribed daily set, +12 on full completion */}
        <View style={{ height: Spacing.lg }} />
        <FadeInView delay={45}>
          {(() => {
            const workout = getTodaysWorkout(new Date().toISOString().split('T')[0]);
            const allDone = workout.every((w) => dailyWorkoutDone.includes(w.key));
            return (
              <AnvilCard padding="lg">
                <View style={styles.wkHead}>
                  <Text style={[styles.wkTitle, { color: colors.muted }]}>TODAY'S BRAIN WORKOUT</Text>
                  <View style={[styles.wkRewardPill, { backgroundColor: `${colors.accent}1A` }]}>
                    <Text style={[styles.wkRewardText, { color: colors.accent }]}>
                      {allDone ? `✓ Claimed +${WORKOUT_REWARD}` : `+${WORKOUT_REWARD} Brainpower`}
                    </Text>
                  </View>
                </View>
                <View style={{ height: 6 }} />
                {workout.map((w, i) => {
                  const done = dailyWorkoutDone.includes(w.key);
                  return (
                    <TouchableOpacity
                      key={w.key}
                      activeOpacity={0.8}
                      disabled={done}
                      onPress={() => { hapticLight(); router.push(w.route as any); }}
                      style={[styles.wkRow, i < workout.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                    >
                      <View style={[styles.wkCheck, { borderColor: done ? colors.accent : colors.border, backgroundColor: done ? colors.accent : 'transparent' }]}>
                        {done && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.wkLabel, { color: colors.text, opacity: done ? 0.55 : 1, textDecorationLine: done ? 'line-through' : 'none' }]}>{w.label}</Text>
                        <Text style={[styles.wkBlurb, { color: colors.muted }]}>{w.blurb}</Text>
                      </View>
                      {!done && <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />}
                    </TouchableOpacity>
                  );
                })}
              </AnvilCard>
            );
          })()}
        </FadeInView>

        <View style={{ height: Spacing.lg }} />

        {/* Unlock status + primary action, together in one card. The action
            (unlock / lock-now / block) is paired with the status it reacts to. */}
        <FadeInView delay={60}>
          <UnlockStatusCard
            appsUnlocked={appsUnlocked}
            unlockExpiresAt={unlockExpiresAt}
            unlockTotalMs={unlockTotalMs}
            isBlocking={settings.screenTimeAppCount > 0}
            onTimerExpired={checkUnlockExpiry}
            onUnlock={handleUnlock}
            onRelock={handleRelock}
            onBlock={handleBlock}
          />
        </FadeInView>

        {/* Setup checklist - only while incomplete */}
        <FadeInView delay={240}>
          <SetupChecklist />
        </FadeInView>
      </ScrollView>

      <StreakDetailModal
        visible={streakOpen}
        onClose={() => setStreakOpen(false)}
        currentStreak={progress.currentStreak}
        longestStreak={progress.longestStreak}
        weeklyPoints={progress.weeklyPoints}
      />

      {/* Unlock duration picker - tap to scroll, at the cost of your rot score */}
      <Modal
        visible={unlockOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setUnlockOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setUnlockOpen(false)}
          style={styles.unlockBackdrop}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.unlockSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.unlockSheetTitle, { color: colors.text }]}>Unlock your apps</Text>
            <Text style={[styles.unlockSheetSub, { color: colors.muted }]}>
              Scrolling lowers your Brainpower Score. The longer you open, the more it costs.
            </Text>
            <View style={{ height: 16 }} />
            {UNLOCK_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.mins}
                activeOpacity={0.85}
                onPress={() => confirmUnlock(opt.mins)}
                style={[styles.unlockOption, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.unlockOptionMins, { color: colors.text }]}>{opt.mins} minutes</Text>
                </View>
                <View style={[styles.unlockCostPill, { backgroundColor: `${colors.accent}1A` }]}>
                  <Text style={[styles.unlockCostText, { color: colors.accent }]}>−{opt.rot} score</Text>
                </View>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Unlock duration picker
  unlockBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  unlockSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1,
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40,
  },
  unlockSheetTitle: { fontSize: 22, fontFamily: FontFamily.semibold, letterSpacing: -0.4 },
  unlockSheetSub: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 20, marginTop: 6 },
  unlockOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 18, marginBottom: 10,
  },
  unlockOptionMins: { fontSize: 17, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
  unlockCostPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  unlockCostText: { fontSize: 13, fontFamily: FontFamily.semibold, letterSpacing: 0.2 },

  // Brain Rot hero
  rotRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  rotEyebrow: { fontSize: 11, fontFamily: FontFamily.medium, letterSpacing: 1.6, marginBottom: 2 },
  rotScore: { fontSize: 56, fontFamily: FontFamily.medium, letterSpacing: -2, lineHeight: 60, fontVariant: ['tabular-nums'] },
  rotPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, marginTop: 4 },
  rotPillText: { fontSize: 11, fontFamily: FontFamily.semibold, letterSpacing: 0.8 },
  rotTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 12 },
  rotFill: { height: '100%', borderRadius: 4 },
  rotGymLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 14 },
  rankToNext: { fontSize: 12, fontFamily: FontFamily.medium, letterSpacing: 0.1, marginTop: 7 },
  // Today's Brain Workout
  wkHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wkTitle: { fontSize: 12, fontFamily: FontFamily.medium, letterSpacing: 1.6 },
  wkRewardPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  wkRewardText: { fontSize: 12, fontFamily: FontFamily.semibold, letterSpacing: 0.2 },
  wkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  wkCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  wkLabel: { fontSize: 16, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
  wkBlurb: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 1 },
  rotGymText: { fontSize: 14, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
  // Unmeasured state
  rotEmptyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  rotEmptyIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rotEmptyTitle: { fontSize: 16, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
  rotEmptySub: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 2 },
  rotBenchBtn: { height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  rotBenchBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },

  root: { flex: 1 },

  // Brand row
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandLogo: { width: 44, height: 44, borderRadius: 10 },
  brand: { fontSize: 28, fontFamily: FontFamily.semibold, letterSpacing: -0.6, lineHeight: 32 },
  tagline: { fontSize: 13, fontFamily: FontFamily.regular, letterSpacing: 0.1, marginTop: 2 },
  streakChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
  },
  streakValue: {
    fontSize: 14, fontFamily: FontFamily.semibold, letterSpacing: -0.1, fontVariant: ['tabular-nums'],
  },

  // Unlock status card
  cellsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cellsIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cellsTitle: { flex: 1, fontSize: FontSize.md, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
  lockedSub: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 2 },
  cellsCount: {
    fontSize: FontSize.md, fontFamily: FontFamily.semibold, letterSpacing: -0.1, fontVariant: ['tabular-nums'],
  },
  progressTrack: { height: 10, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },

  // Action button sitting inside the unlock-status card, below its content.
  cardAction: { marginTop: 14 },

  // Primary unlock button
  unlockBtn: {
    height: 60,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  unlockBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  relockBtn: {
    height: 56,
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  relockBtnText: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },

  // Section label rows
  sectionLabelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md,
  },
  sectionCount: { fontSize: 12, fontFamily: FontFamily.medium, letterSpacing: 1.6 },
  seeAll: { fontSize: 13, fontFamily: FontFamily.medium, letterSpacing: 0.1 },

  // Setup checklist
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  checklistTitle: { fontSize: FontSize.md, fontFamily: FontFamily.semibold, letterSpacing: -0.1 },
  checklistDesc: { fontSize: 14, fontFamily: FontFamily.regular, marginTop: 3 },
  dismissRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginTop: 10, paddingHorizontal: 4,
  },
  dismissText: { fontSize: 12, fontFamily: FontFamily.regular },
});
