import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  CheckCircle2, Circle as CircleIcon, ChevronRight, X, Flame,
  Smartphone, Lock, LockOpen,
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
}: {
  appsUnlocked: boolean;
  unlockExpiresAt: number | null;
  unlockTotalMs: number | null;
  isBlocking: boolean;
  onTimerExpired: () => void;
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
      </AnvilCard>
    );
  }

  // No apps chosen yet → don't claim anything is "locked".
  if (!isBlocking) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => { hapticLight(); router.push('/(tabs)/lock'); }}>
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
        </AnvilCard>
      </TouchableOpacity>
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
            Pass a challenge to earn screen time
          </Text>
        </View>
      </View>
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
      title: 'Pass a challenge to unlock',
      description: 'Complete a challenge to earn screen time',
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
  } = useStore();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  const [streakOpen, setStreakOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(checkUnlockExpiry, 30000);
    return () => clearInterval(id);
  }, [checkUnlockExpiry]);

  const handleUnlock = () => {
    hapticLight();
    track('unlock_opened', { source: 'home' });
    router.push('/(tabs)/games');
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

  const isBlocking = settings.screenTimeAppCount > 0;

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

        {/* Unlock status (countdown or locked) */}
        <FadeInView delay={60}>
          <UnlockStatusCard
            appsUnlocked={appsUnlocked}
            unlockExpiresAt={unlockExpiresAt}
            unlockTotalMs={unlockTotalMs}
            isBlocking={settings.screenTimeAppCount > 0}
            onTimerExpired={checkUnlockExpiry}
          />
        </FadeInView>

        <View style={{ height: Spacing.lg }} />

        {/* Primary action depends on state: block apps → unlock → lock early */}
        <FadeInView delay={120}>
          {appsUnlocked ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleRelock}
              style={[styles.relockBtn, { borderColor: colors.borderStrong, backgroundColor: colors.card }]}
            >
              <Lock size={20} color={colors.text} strokeWidth={2.2} />
              <Text style={[styles.relockBtnText, { color: colors.text }]}>Lock apps now</Text>
            </TouchableOpacity>
          ) : isBlocking ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleUnlock}
              style={[styles.unlockBtn, { backgroundColor: colors.accent }]}
            >
              <LockOpen size={22} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.unlockBtnText}>Unlock apps</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleBlock}
              style={[styles.unlockBtn, { backgroundColor: colors.accent }]}
            >
              <Lock size={22} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.unlockBtnText}>Block apps</Text>
            </TouchableOpacity>
          )}
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
    </View>
  );
}

const styles = StyleSheet.create({
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
