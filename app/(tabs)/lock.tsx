import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, Alert, ActivityIndicator, Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { ChevronRight, AlertTriangle, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { track, Events } from '../../src/services/analytics';
import { FadeInView } from '../../src/components/ui/AnimatedElements';
import { hapticLight, hapticMedium, hapticSuccess } from '../../src/utils/haptics';
import { ScreenTime } from 'screen-time-module';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import DisableCountdownScreen from '../../src/components/DisableCountdownScreen';
import { FontFamily, FontSize, Spacing } from '../../src/constants/theme';
import { Eyebrow, SectionHeading, MutedText, AnvilCard, Pill } from '../../src/components/ui/anvil';

// Inline success toast.
function InlineToast({ message, visible }: { message: string; visible: boolean }) {
  const { colors, isDark } = useThemeColors();
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify().damping(14)}
      exiting={FadeOut.duration(250)}
      style={[styles.toast, {
        backgroundColor: isDark ? 'rgba(34,197,94,0.10)' : '#ECFDF5',
        borderColor: isDark ? 'rgba(34,197,94,0.25)' : '#A7F3D0',
      }]}
    >
      <Animated.View
        entering={FadeIn.delay(150).duration(200)}
        style={styles.toastIcon}
      >
        <Check size={13} color="#FFFFFF" strokeWidth={3} />
      </Animated.View>
      <Text style={[styles.toastText, { color: isDark ? '#6EE7B7' : '#065F46' }]}>
        {message}
      </Text>
    </Animated.View>
  );
}

export default function LockScreen() {
  const { updateSettings, appsUnlocked, unlockExpiresAt } = useStore();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  const [authStatus, setAuthStatus] = useState<'approved' | 'denied' | 'notDetermined' | 'unavailable'>('notDetermined');
  const [appCount, setAppCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [unblocking, setUnblocking] = useState(false);

  // Disable-countdown state for the "stop blocking" friction path
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const countdownStartTime = useRef<number>(0);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTotalRef = useRef<number>(0);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  useEffect(() => {
    if (!ScreenTime.isAvailable) { setAuthStatus('unavailable'); return; }
    checkStatus();
  }, []);

  useEffect(() => {
    const sub = ScreenTime.addSelectionChangeListener?.((event) => {
      const count = event.count;
      setAppCount(count);
      updateSettings({ screenTimeAppCount: count });
      if (count > 0) {
        hapticSuccess();
        track(Events.AppsSelected, { app_count: count });
        // Always-blocked model: as soon as a non-zero selection is set,
        // engage the shield. The only path back is unlock-via-games or
        // the explicit "Stop blocking" button.
        ScreenTime.blockApps().catch(() => { });
        showToast('Blocking active');
      }
    });
    return () => { sub?.remove(); };
  }, []);

  const checkStatus = async () => {
    try {
      const status = await ScreenTime.getAuthorizationStatus();
      setAuthStatus(status);
      if (status === 'approved') {
        updateSettings({ screenTimeAuthorized: true });
        const count = await ScreenTime.getSelectionCount();
        setAppCount(count);
        updateSettings({ screenTimeAppCount: count });
      }
    } catch { /* notDetermined */ }
  };

  const handleAuthorize = useCallback(async () => {
    if (!ScreenTime.isAvailable) {
      Alert.alert('Not Available', 'Screen Time is only available on iOS devices.');
      return;
    }
    track(Events.AuthRequested);
    setLoading(true);
    hapticLight();
    try {
      const result = await ScreenTime.requestAuthorization();
      const status = result.startsWith('denied') ? 'denied' : result;
      const reason = result.includes(':') ? result.split(':').slice(1).join(':') : '';
      setAuthStatus(status as any);
      updateSettings({ screenTimeAuthorized: status === 'approved' });
      if (status === 'approved') {
        hapticSuccess();
      } else if (status === 'denied') {
        Alert.alert(
          'Access not granted',
          `Brainlock needs Screen Time access to block apps.${reason ? `\n\n${reason}` : ''}\n\nEnable it in Settings → Screen Time → Brainlock.`,
        );
      }
    } catch (e: any) {
      Alert.alert('Something went wrong', `Couldn't reach Screen Time.\n\n${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePickApps = useCallback(async () => {
    hapticLight();
    try { await ScreenTime.showAppPicker(); } catch { /* user cancelled */ }
  }, []);

  const performUnblock = useCallback(async () => {
    setUnblocking(true);
    hapticMedium();
    try {
      await ScreenTime.unblockAll();
      setAppCount(0);
      updateSettings({ screenTimeAppCount: 0 });
      hapticSuccess();
      track(Events.ScheduleDisabled);
      showToast('Blocking turned off');
    } catch {
      Alert.alert('Something went wrong', 'Couldn\'t turn off blocking. Try again.');
    } finally {
      setUnblocking(false);
    }
  }, []);

  const getCountdownSeconds = useCallback((difficulty: string) => {
    switch (difficulty) {
      case 'medium': return 30;
      case 'hard': return 60;
      case 'hardest': return 300;
      default: return 0;
    }
  }, []);

  const { settings } = useStore();
  const handleStopBlocking = useCallback(() => {
    const seconds = getCountdownSeconds(settings.disableDifficulty);
    if (seconds > 0) {
      hapticMedium();
      countdownStartTime.current = Date.now();
      countdownTotalRef.current = seconds;
      setCountdownRemaining(seconds);
      setCountdownActive(true);
      return;
    }
    hapticLight();
    performUnblock();
  }, [settings.disableDifficulty, performUnblock, getCountdownSeconds]);

  useEffect(() => {
    if (!countdownActive) return;
    countdownInterval.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - countdownStartTime.current) / 1000);
      const remaining = Math.max(0, countdownTotalRef.current - elapsed);
      setCountdownRemaining(remaining);
      if (remaining <= 0) {
        if (countdownInterval.current) clearInterval(countdownInterval.current);
        countdownInterval.current = null;
        setCountdownActive(false);
        performUnblock();
      }
    }, 1000);
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
    };
  }, [countdownActive, performUnblock]);

  const handleCancelCountdown = useCallback(() => {
    Alert.alert(
      'Stop the timer?',
      "It'll reset. You'll wait the full duration next time.",
      [
        { text: 'Keep waiting', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            if (countdownInterval.current) clearInterval(countdownInterval.current);
            countdownInterval.current = null;
            setCountdownActive(false);
            setCountdownRemaining(0);
            hapticLight();
          },
        },
      ],
    );
  }, []);

  const isAuthorized = authStatus === 'approved';
  const hasApps = appCount > 0;

  // Compute remaining unlock minutes for the status pill
  const remainingUnlockMins = appsUnlocked && unlockExpiresAt
    ? Math.max(0, Math.ceil((unlockExpiresAt - Date.now()) / 60000))
    : 0;

  // Hero copy & stat by state
  let heroStat: string | null = null;
  let heroLabel: string | null = null;
  let heroDescription = '';
  if (!isAuthorized) {
    heroDescription = 'Enable Screen Time to block distracting apps.';
  } else if (!hasApps) {
    heroDescription = 'Pick apps to block. The only way back in is to play games to earn unlock minutes.';
  } else if (appsUnlocked) {
    heroStat = String(remainingUnlockMins);
    heroLabel = remainingUnlockMins === 1 ? 'MINUTE LEFT' : 'MINUTES LEFT';
    heroDescription = 'Apps are open. They re-block automatically when the timer ends.';
  } else {
    heroStat = String(appCount);
    heroLabel = appCount === 1 ? 'APP BLOCKED' : 'APPS BLOCKED';
    heroDescription = 'Locked. Play a brain game to earn unlock minutes.';
  }

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
        <Animated.View layout={LinearTransition.springify().damping(16).stiffness(120)}>
          {/* Header */}
          <FadeInView delay={0}>
            <Eyebrow>Block the bad</Eyebrow>
            <SectionHeading size="lg">
              {appsUnlocked ? 'Apps open.' : hasApps ? 'Brainrot, blocked.' : isAuthorized ? 'Almost there.' : 'Cut the brainrot.'}
            </SectionHeading>
            <View style={{ height: 8 }} />
            <MutedText size="md">{heroDescription}</MutedText>
          </FadeInView>

          <View style={{ height: Spacing.lg }} />

          {/* Inline toast */}
          <InlineToast message={toast ?? ''} visible={!!toast} />

          {/* Hero stat */}
          {heroStat && (
            <FadeInView delay={80}>
              <AnvilCard padding="xl">
                <Text style={[styles.heroStat, { color: colors.accent }]}>{heroStat}</Text>
                <Text style={[styles.heroStatLabel, { color: colors.muted }]}>{heroLabel}</Text>
                {hasApps && !appsUnlocked && (
                  <View style={{ marginTop: 14 }}>
                    <Pill tone="success">BLOCKING ACTIVE</Pill>
                  </View>
                )}
                {appsUnlocked && (
                  <View style={{ marginTop: 14 }}>
                    <Pill tone="success">UNLOCKED</Pill>
                  </View>
                )}
              </AnvilCard>
              <View style={{ height: Spacing.lg }} />
            </FadeInView>
          )}

          {/* Unavailable on non-iOS */}
          {authStatus === 'unavailable' && (
            <Animated.View entering={FadeInDown.duration(350).damping(16)} exiting={FadeOutUp.duration(250)}>
              <AnvilCard padding="md">
                <View style={styles.row}>
                  <AlertTriangle size={16} color={colors.error} strokeWidth={2} />
                  <Text style={[styles.rowDescription, { color: colors.secondary, flex: 1 }]}>
                    Screen Time app blocking is only available on iOS devices.
                  </Text>
                </View>
              </AnvilCard>
            </Animated.View>
          )}

          {/* Step 1: Permission */}
          {authStatus !== 'unavailable' && (
            <FadeInView delay={150}>
              <View style={styles.sectionLabelRow}>
                <Eyebrow style={{ marginBottom: 0 }}>Step 1</Eyebrow>
                {isAuthorized && <Pill tone="success">DONE</Pill>}
              </View>
              <AnvilCard
                padding="md"
                onPress={isAuthorized || loading ? undefined : handleAuthorize}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: isAuthorized ? colors.muted : colors.text }]}>
                      {isAuthorized ? 'Screen Time authorized' : 'Authorize Screen Time'}
                    </Text>
                    <Text style={[styles.rowDescription, { color: colors.muted }]}>
                      {isAuthorized
                        ? "Brainlock can block apps you pick. It can't see what you do in them."
                        : "Required to block apps. Brainlock can't see what you do inside them."}
                    </Text>
                  </View>
                  {!isAuthorized && (loading
                    ? <ActivityIndicator size="small" color={colors.accent} />
                    : <ChevronRight size={18} color={colors.muted} strokeWidth={2} />)}
                </View>
              </AnvilCard>
            </FadeInView>
          )}

          {/* Step 2: Pick apps */}
          {isAuthorized && (
            <Animated.View entering={FadeInDown.duration(400).springify().damping(16)} exiting={FadeOutUp.duration(250)}>
              <View style={styles.sectionLabelRow}>
                <Eyebrow style={{ marginBottom: 0 }}>Step 2</Eyebrow>
                {hasApps && <Pill tone="success">DONE</Pill>}
              </View>
              <AnvilCard padding="md" onPress={handlePickApps}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>
                      {hasApps ? `${appCount} selected` : 'Choose apps to block'}
                    </Text>
                    <Text style={[styles.rowDescription, { color: colors.muted }]}>
                      {hasApps ? 'Tap to change your selection. Block stays on.' : 'Opens the iOS app picker. Block engages immediately.'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.muted} strokeWidth={2} />
                </View>
              </AnvilCard>
            </Animated.View>
          )}

          {/* Stop blocking - uses the disable-countdown friction */}
          {isAuthorized && hasApps && (
            <Animated.View entering={FadeInDown.delay(80).duration(400).springify().damping(16)} exiting={FadeOutUp.duration(250)}>
              <View style={{ height: Spacing.lg }} />
              <TouchableOpacity
                onPress={handleStopBlocking}
                disabled={unblocking}
                activeOpacity={0.7}
                style={[styles.disableBtn, { borderColor: colors.border }]}
              >
                {unblocking
                  ? <ActivityIndicator size="small" color={colors.error} />
                  : <Text style={[styles.disableBtnText, { color: colors.error }]}>Stop blocking</Text>}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* How it works - quiet footer */}
          <FadeInView delay={isAuthorized && hasApps ? 240 : 200}>
            <View style={{ marginTop: Spacing.xl }}>
              <Text style={[styles.howTitle, { color: colors.text }]}>How it works</Text>
              <Text style={[styles.howBody, { color: colors.secondary }]}>
                Pick the apps you want blocked. They stay blocked until you unselect them or unlock from the home screen.
              </Text>
            </View>
          </FadeInView>

          <View style={{ height: Spacing.xl }} />
        </Animated.View>
      </ScrollView>

      <Modal
        visible={countdownActive}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <DisableCountdownScreen
          remainingSeconds={countdownRemaining}
          totalSeconds={countdownTotalRef.current}
          onCancel={handleCancelCountdown}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Hero
  heroStat: {
    fontSize: 56,
    fontFamily: FontFamily.medium,
    letterSpacing: -2,
    lineHeight: 60,
  },
  heroStatLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginTop: 4,
  },

  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },
  rowDescription: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 2,
    lineHeight: 18,
  },

  disableBtn: {
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disableBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },

  howTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  howBody: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 19,
  },

  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  toastIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
});
