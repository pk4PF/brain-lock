import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator, Modal } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Info, Clock, ChevronRight, CheckCircle, AlertTriangle, Check, Minus, Plus, Brain } from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { GlowCard, ListCard } from '../../src/components/ui/GlowCard';
import { SectionTitle } from '../../src/components/ui/SectionTitle';
import { IconBadge } from '../../src/components/ui/IconBadge';
import { FadeInView, PulsingIcon } from '../../src/components/ui/AnimatedElements';
import { hapticLight, hapticMedium, hapticSuccess } from '../../src/utils/haptics';
import { ScreenTime } from 'screen-time-module';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { TimePickerSheet } from '../../src/components/ui/TimePickerSheet';
import DisableCountdownScreen from '../../src/components/DisableCountdownScreen';

const GREEN = '#22C55E';

const formatHour = (h: number) => {
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${period}`;
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const SPRING_CONFIG = { damping: 15, stiffness: 150, mass: 0.8 };
const SPRING_BOUNCY = { damping: 12, stiffness: 180, mass: 0.6 };

// Animated pressable button with spring scale
function AnimatedButton({
  onPress,
  disabled,
  children,
  style,
}: {
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: any;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, SPRING_BOUNCY);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_BOUNCY);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={style}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

// Inline success toast that appears briefly
function InlineToast({ message, visible }: { message: string; visible: boolean }) {
  const { colors, isDark } = useThemeColors();
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify().damping(14)}
      exiting={FadeOut.duration(250)}
      style={{
        backgroundColor: isDark ? 'rgba(34,197,94,0.1)' : '#ECFDF5',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(34,197,94,0.25)' : '#A7F3D0',
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
      }}
    >
      <Animated.View
        entering={FadeIn.delay(150).duration(200)}
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: GREEN,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Check size={14} color="#FFFFFF" strokeWidth={3} />
      </Animated.View>
      <Text color={isDark ? '#6EE7B7' : '#065F46'} fontSize={14} fontWeight="600" flex={1}>
        {message}
      </Text>
    </Animated.View>
  );
}

const DEFAULT_DAYS = [true, true, true, true, true, true, true];

export default function LockScreen() {
  const { settings, updateSettings } = useStore();
  const activeDays = settings.activeDays ?? DEFAULT_DAYS;
  const insets = useSafeAreaInsets();
  const { colors, isDark, gradients } = useThemeColors();

  const [authStatus, setAuthStatus] = useState<'approved' | 'denied' | 'notDetermined' | 'unavailable'>('notDetermined');
  const [appCount, setAppCount] = useState(settings.screenTimeAppCount);
  const [loading, setLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);

  // Countdown state (medium difficulty)
  const COUNTDOWN_SECONDS = 30;
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const countdownStartTime = useRef<number>(0);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Toast state
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Check authorization and selection on mount
  useEffect(() => {
    if (!ScreenTime.isAvailable) {
      setAuthStatus('unavailable');
      return;
    }
    checkStatus();
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
    } catch {
      // Silently handle — will show as notDetermined
    }
  };

  const handleAuthorize = useCallback(async () => {
    if (!ScreenTime.isAvailable) {
      Alert.alert('Not Available', 'Screen Time is only available on iOS devices.');
      return;
    }
    setLoading(true);
    hapticLight();
    try {
      console.log('[LockScreen] Requesting Screen Time authorization...');
      const result = await ScreenTime.requestAuthorization();
      console.log('[LockScreen] Authorization result:', result);

      // Handle "denied:reason" format from native module
      const status = result.startsWith('denied') ? 'denied' : result;
      const reason = result.includes(':') ? result.split(':').slice(1).join(':') : '';

      setAuthStatus(status as any);
      updateSettings({ screenTimeAuthorized: status === 'approved' });
      if (status === 'approved') {
        hapticSuccess();
      } else if (status === 'denied') {
        Alert.alert(
          'Permission Denied',
          `BrainLock needs Screen Time access to block apps.${reason ? `\n\nReason: ${reason}` : ''}\n\nYou can enable it in Settings > Screen Time > BrainLock.`
        );
      }
    } catch (e: any) {
      console.log('[LockScreen] Screen Time authorization error:', e?.message || e);
      Alert.alert('Error', `Could not request Screen Time permission.\n\nDetails: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePickApps = useCallback(async () => {
    hapticLight();
    try {
      await ScreenTime.showAppPicker();
      // After picker closes, refresh the count
      const count = await ScreenTime.getSelectionCount();
      setAppCount(count);
      updateSettings({ screenTimeAppCount: count });
      if (count > 0) hapticSuccess();
    } catch {
      // User cancelled the picker
    }
  }, []);

  const handleApplySchedule = useCallback(async () => {
    setScheduleLoading(true);
    hapticMedium();
    try {
      await ScreenTime.setSchedule(
        settings.activeHoursStart,
        0,
        settings.activeHoursEnd,
        59
      );
      updateSettings({ screenTimeScheduleEnabled: true });
      hapticSuccess();
      showToast(`Schedule active: ${formatHour(settings.activeHoursStart)} – ${formatHour(settings.activeHoursEnd)}`);
    } catch {
      Alert.alert('Error', 'Could not set schedule. Please try again.');
    } finally {
      setScheduleLoading(false);
    }
  }, [settings.activeHoursStart, settings.activeHoursEnd]);

  const performDisable = useCallback(async () => {
    setScheduleLoading(true);
    try {
      await ScreenTime.setScheduleEnabled(false);
      await ScreenTime.removeShieldNow();
      updateSettings({ screenTimeScheduleEnabled: false });
      hapticSuccess();
      showToast('Schedule disabled');
    } catch {
      Alert.alert('Error', 'Could not disable schedule.');
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  const handleDisableSchedule = useCallback(() => {
    if (settings.disableDifficulty === 'medium') {
      hapticMedium();
      countdownStartTime.current = Date.now();
      setCountdownRemaining(COUNTDOWN_SECONDS);
      setCountdownActive(true);
      return;
    }
    // Easy mode — instant disable
    hapticLight();
    performDisable();
  }, [settings.disableDifficulty, performDisable]);

  // Countdown interval — wall-clock based for accuracy after backgrounding
  useEffect(() => {
    if (!countdownActive) return;

    countdownInterval.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - countdownStartTime.current) / 1000);
      const remaining = Math.max(0, COUNTDOWN_SECONDS - elapsed);
      setCountdownRemaining(remaining);

      if (remaining <= 0) {
        if (countdownInterval.current) clearInterval(countdownInterval.current);
        countdownInterval.current = null;
        setCountdownActive(false);
        performDisable();
      }
    }, 1000);

    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
    };
  }, [countdownActive, performDisable]);

  const handleCancelCountdown = useCallback(() => {
    Alert.alert(
      'Cancel Countdown?',
      'The timer will reset. You\'ll need to wait again next time.',
      [
        { text: 'Keep Waiting', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            if (countdownInterval.current) {
              clearInterval(countdownInterval.current);
              countdownInterval.current = null;
            }
            setCountdownActive(false);
            setCountdownRemaining(0);
            hapticLight();
          },
        },
      ]
    );
  }, []);



  const isAuthorized = authStatus === 'approved';
  const hasApps = appCount > 0;

  return (
    <YStack flex={1} backgroundColor={colors.background}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
      >
        <Animated.View layout={LinearTransition.springify().damping(16).stiffness(120)}>
          {/* Header */}
          <FadeInView delay={0}>
            <Text
              color={colors.text}
              fontSize={28}
              fontWeight="700"
              letterSpacing={-0.5}
              marginBottom={24}
            >
              Block Apps
            </Text>
          </FadeInView>

          {/* Inline Toast */}
          <InlineToast message={toast ?? ''} visible={!!toast} />

          {/* Status Card - green gradient */}
          <FadeInView delay={100}>
            <GlowCard elevated marginBottom={16} padding={0} overflow="hidden" borderWidth={0}>
              <LinearGradient
                colors={gradients.heroGreen}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 24, alignItems: 'center' }}
              >
                <PulsingIcon size={56}>
                  <Shield size={26} color="#FFFFFF" />
                </PulsingIcon>
                <Text color="#FFFFFF" fontSize={20} fontWeight="700" marginTop={14}>
                  {!isAuthorized
                    ? 'Set Up App Blocking'
                    : hasApps
                      ? 'App Blocking Active'
                      : 'Choose Apps to Block'}
                </Text>
                <Text color="rgba(255,255,255,0.65)" fontSize={14} marginTop={4} textAlign="center">
                  {!isAuthorized
                    ? 'Enable Screen Time to block distracting apps'
                    : hasApps
                      ? `${appCount} app${appCount !== 1 ? 's' : ''} / categor${appCount !== 1 ? 'ies' : 'y'} selected`
                      : 'Tap below to select apps you want to block'}
                </Text>
              </LinearGradient>
            </GlowCard>
          </FadeInView>

          {/* Unavailable on non-iOS */}
          {authStatus === 'unavailable' && (
            <Animated.View entering={FadeInDown.duration(350).damping(16)} exiting={FadeOutUp.duration(250)}>
              <GlowCard glass size="sm" marginBottom={16}>
                <XStack alignItems="center" gap={12}>
                  <IconBadge size={32} color="#EF4444">
                    <AlertTriangle size={14} color="#EF4444" />
                  </IconBadge>
                  <Text color={colors.secondary} fontSize={13} lineHeight={19} flex={1}>
                    Screen Time app blocking is only available on iOS devices.
                  </Text>
                </XStack>
              </GlowCard>
            </Animated.View>
          )}

          {/* Step 1: Authorization */}
          {authStatus !== 'unavailable' && (
            <FadeInView delay={200}>
              <SectionTitle title="Step 1: Permission" />
              <AnimatedButton
                onPress={handleAuthorize}
                disabled={isAuthorized || loading}
              >
                <GlowCard
                  accent={isAuthorized}
                  padding={0}
                  marginBottom={20}
                >
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingVertical={16}
                    paddingHorizontal={20}
                  >
                    <XStack alignItems="center" gap={14}>
                      <IconBadge size={40} color={isAuthorized ? GREEN : colors.accent} glow={isAuthorized}>
                        {isAuthorized ? (
                          <CheckCircle size={18} color={GREEN} />
                        ) : loading ? (
                          <ActivityIndicator size="small" color={colors.accent} />
                        ) : (
                          <Shield size={18} color={colors.accent} />
                        )}
                      </IconBadge>
                      <YStack>
                        <Text color={colors.text} fontSize={16} fontWeight="600">
                          {isAuthorized ? 'Screen Time Enabled' : 'Enable Screen Time'}
                        </Text>
                        <Text color={colors.muted} fontSize={13} marginTop={2}>
                          {isAuthorized
                            ? 'BrainLock can manage app access'
                            : 'Required to block apps on your device'}
                        </Text>
                      </YStack>
                    </XStack>
                    {!isAuthorized && !loading && (
                      <ChevronRight size={20} color={colors.muted} />
                    )}
                  </XStack>
                </GlowCard>
              </AnimatedButton>
            </FadeInView>
          )}

          {/* Step 2: Pick Apps */}
          {isAuthorized && (
            <Animated.View
              entering={FadeInDown.duration(400).springify().damping(16)}
              exiting={FadeOutUp.duration(250)}
            >
              <SectionTitle title="Step 2: Choose Apps" />
              <AnimatedButton onPress={handlePickApps}>
                <GlowCard
                  accent={hasApps}
                  padding={0}
                  marginBottom={20}
                >
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingVertical={16}
                    paddingHorizontal={20}
                  >
                    <XStack alignItems="center" gap={14}>
                      <IconBadge size={40} color={hasApps ? GREEN : colors.accent} glow={hasApps}>
                        {hasApps ? (
                          <CheckCircle size={18} color={GREEN} />
                        ) : (
                          <Shield size={18} color={colors.accent} />
                        )}
                      </IconBadge>
                      <YStack>
                        <Text color={colors.text} fontSize={16} fontWeight="600">
                          {hasApps ? `${appCount} Selected` : 'Select Apps to Block'}
                        </Text>
                        <Text color={colors.muted} fontSize={13} marginTop={2}>
                          {hasApps
                            ? 'Tap to change your selection'
                            : 'Opens the iOS app picker'}
                        </Text>
                      </YStack>
                    </XStack>
                    <ChevronRight size={20} color={colors.muted} />
                  </XStack>
                </GlowCard>
              </AnimatedButton>
            </Animated.View>
          )}

          {/* Step 3: Schedule */}
          {isAuthorized && hasApps && (
            <Animated.View
              entering={FadeInDown.delay(100).duration(400).springify().damping(16)}
              exiting={FadeOutUp.duration(250)}
            >
              <SectionTitle title="Step 3: Set Schedule" />

              {/* ── Schedule Card: From / To rows ── */}
              <GlowCard accent marginBottom={12} padding={0} overflow="hidden">
                <XStack alignItems="center" gap={10} paddingHorizontal={20} paddingTop={20} paddingBottom={14}>
                  <IconBadge size={36}>
                    <Clock size={16} color={colors.accent} />
                  </IconBadge>
                  <Text color={colors.text} fontSize={16} fontWeight="700">
                    Block Time
                  </Text>
                </XStack>

                {/* From row */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => { hapticLight(); setPickerTarget('start'); }}
                >
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingHorizontal={20}
                    paddingVertical={16}
                    borderTopWidth={1}
                    borderTopColor={colors.border}
                  >
                    <XStack alignItems="center" gap={10}>
                      <View width={8} height={8} borderRadius={4} backgroundColor={colors.accent} />
                      <Text color={colors.secondary} fontSize={15} fontWeight="500">From</Text>
                    </XStack>
                    <XStack alignItems="center" gap={6}>
                      <Text color={colors.text} fontSize={16} fontWeight="600">
                        {formatHour(settings.activeHoursStart)}
                      </Text>
                      <ChevronRight size={16} color={colors.muted} />
                    </XStack>
                  </XStack>
                </TouchableOpacity>

                {/* Divider with connector */}
                <View paddingLeft={24}>
                  <View width={1} height={8} backgroundColor={colors.border} marginLeft={3} />
                </View>

                {/* To row */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => { hapticLight(); setPickerTarget('end'); }}
                >
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingHorizontal={20}
                    paddingVertical={16}
                    borderBottomWidth={1}
                    borderBottomColor={colors.border}
                  >
                    <XStack alignItems="center" gap={10}>
                      <View width={8} height={8} borderRadius={4} borderWidth={1.5} borderColor={colors.muted} />
                      <Text color={colors.secondary} fontSize={15} fontWeight="500">To</Text>
                    </XStack>
                    <XStack alignItems="center" gap={6}>
                      <Text color={colors.text} fontSize={16} fontWeight="600">
                        {formatHour(settings.activeHoursEnd)}
                      </Text>
                      <ChevronRight size={16} color={colors.muted} />
                    </XStack>
                  </XStack>
                </TouchableOpacity>

                <View height={12} />
              </GlowCard>

              {/* ── Days Card ── */}
              <GlowCard marginBottom={12}>
                <XStack alignItems="center" justifyContent="space-between" marginBottom={14}>
                  <Text color={colors.secondary} fontSize={14} fontWeight="600">On these days:</Text>
                  <Text color={colors.accent} fontSize={13} fontWeight="600">
                    {activeDays.every(Boolean)
                      ? 'Every day'
                      : activeDays.filter(Boolean).length === 0
                        ? 'None'
                        : `${activeDays.filter(Boolean).length} days`}
                  </Text>
                </XStack>
                <XStack justifyContent="space-between">
                  {DAY_LABELS.map((label, i) => {
                    const active = activeDays[i];
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => {
                          hapticLight();
                          const next = [...activeDays];
                          next[i] = !next[i];
                          updateSettings({ activeDays: next });
                        }}
                        activeOpacity={0.7}
                      >
                        <View
                          width={40}
                          height={40}
                          borderRadius={20}
                          backgroundColor={active ? colors.accent : colors.cardAlt}
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Text
                            color={active ? '#FFFFFF' : colors.muted}
                            fontSize={13}
                            fontWeight="700"
                          >
                            {label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </XStack>
              </GlowCard>

              {/* ── Apps Blocked Card ── */}
              <AnimatedButton onPress={handlePickApps}>
                <GlowCard padding={0} marginBottom={12}>
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingVertical={16}
                    paddingHorizontal={20}
                  >
                    <Text color={colors.text} fontSize={16} fontWeight="600">
                      Apps Blocked
                    </Text>
                    <XStack alignItems="center" gap={8}>
                      <View
                        width={26}
                        height={26}
                        borderRadius={6}
                        backgroundColor={colors.accentLight}
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Text color={colors.accent} fontSize={12} fontWeight="700">{appCount}</Text>
                      </View>
                      <Text color={colors.accent} fontSize={14} fontWeight="600">Block List</Text>
                      <ChevronRight size={16} color={colors.accent} />
                    </XStack>
                  </XStack>
                </GlowCard>
              </AnimatedButton>

              {/* ── Activate / Disable Button ── */}
              {settings.screenTimeScheduleEnabled ? (
                settings.disableDifficulty !== 'hard' ? (
                  <AnimatedButton onPress={handleDisableSchedule} disabled={scheduleLoading}>
                    <YStack
                      paddingVertical={14}
                      borderRadius={14}
                      backgroundColor={isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2'}
                      borderWidth={1}
                      borderColor={isDark ? 'rgba(239,68,68,0.25)' : '#FECACA'}
                      alignItems="center"
                      marginBottom={12}
                    >
                      {scheduleLoading ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <Text color="#DC2626" fontSize={15} fontWeight="700">
                          Disable Schedule
                        </Text>
                      )}
                    </YStack>
                  </AnimatedButton>
                ) : null
              ) : (
                <AnimatedButton onPress={handleApplySchedule} disabled={scheduleLoading}>
                  <LinearGradient
                    colors={[colors.accent, colors.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}
                  >
                    <YStack paddingVertical={14} alignItems="center">
                      {scheduleLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text color="#FFFFFF" fontSize={15} fontWeight="700">
                          Activate Schedule
                        </Text>
                      )}
                    </YStack>
                  </LinearGradient>
                </AnimatedButton>
              )}
            </Animated.View>
          )}



          {/* ── Challenges to Unlock ── */}
          {isAuthorized && hasApps && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400).springify().damping(16)}
              exiting={FadeOutUp.duration(250)}
            >
              <SectionTitle title="Challenges to Unlock" />
              <GlowCard marginBottom={12}>
                <XStack alignItems="center" justifyContent="space-between">
                  <YStack flex={1} marginRight={16}>
                    <Text color={colors.text} fontSize={15} fontWeight="600">
                      Games required
                    </Text>
                    <Text color={colors.muted} fontSize={12} marginTop={2}>
                      Brain challenges needed to unlock apps
                    </Text>
                  </YStack>
                  <XStack alignItems="center" gap={12}>
                    <TouchableOpacity
                      onPress={() => {
                        hapticLight();
                        if (settings.challengesRequired > 1) {
                          updateSettings({ challengesRequired: settings.challengesRequired - 1 });
                        }
                      }}
                      activeOpacity={0.6}
                      disabled={settings.challengesRequired <= 1}
                    >
                      <View
                        width={36}
                        height={36}
                        borderRadius={18}
                        backgroundColor={settings.challengesRequired <= 1 ? colors.cardAlt : colors.accentLight}
                        justifyContent="center"
                        alignItems="center"
                        borderWidth={1}
                        borderColor={settings.challengesRequired <= 1 ? colors.border : colors.accent}
                        opacity={settings.challengesRequired <= 1 ? 0.4 : 1}
                      >
                        <Minus size={16} color={settings.challengesRequired <= 1 ? colors.muted : colors.accent} />
                      </View>
                    </TouchableOpacity>
                    <Text color={colors.text} fontSize={22} fontWeight="700" width={32} textAlign="center">
                      {settings.challengesRequired}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        hapticLight();
                        if (settings.challengesRequired < 10) {
                          updateSettings({ challengesRequired: settings.challengesRequired + 1 });
                        }
                      }}
                      activeOpacity={0.6}
                      disabled={settings.challengesRequired >= 10}
                    >
                      <View
                        width={36}
                        height={36}
                        borderRadius={18}
                        backgroundColor={settings.challengesRequired >= 10 ? colors.cardAlt : colors.accentLight}
                        justifyContent="center"
                        alignItems="center"
                        borderWidth={1}
                        borderColor={settings.challengesRequired >= 10 ? colors.border : colors.accent}
                        opacity={settings.challengesRequired >= 10 ? 0.4 : 1}
                      >
                        <Plus size={16} color={settings.challengesRequired >= 10 ? colors.muted : colors.accent} />
                      </View>
                    </TouchableOpacity>
                  </XStack>
                </XStack>
              </GlowCard>
            </Animated.View>
          )}

          {/* ── Disable Difficulty ── */}
          {isAuthorized && hasApps && (
            <Animated.View
              entering={FadeInDown.delay(300).duration(400).springify().damping(16)}
              exiting={FadeOutUp.duration(250)}
            >
              <SectionTitle title="Disable Difficulty" />
              <GlowCard marginBottom={20}>
                <XStack gap={8} marginBottom={12}>
                  {([
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' },
                  ] as const).map(({ value, label }) => {
                    const active = settings.disableDifficulty === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        activeOpacity={0.7}
                        onPress={() => {
                          hapticLight();
                          updateSettings({ disableDifficulty: value });
                        }}
                        style={{
                          flex: 1,
                          borderRadius: 12,
                          overflow: 'hidden',
                        }}
                      >
                        {active ? (
                          <LinearGradient
                            colors={[colors.accent, colors.accentDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              paddingVertical: 10,
                              alignItems: 'center',
                              borderRadius: 12,
                            }}
                          >
                            <Text color="#FFFFFF" fontSize={14} fontWeight="600">
                              {label}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <YStack
                            paddingVertical={10}
                            alignItems="center"
                            backgroundColor={colors.cardAlt}
                            borderRadius={12}
                            borderWidth={1}
                            borderColor={colors.border}
                          >
                            <Text color={colors.secondary} fontSize={14} fontWeight="500">
                              {label}
                            </Text>
                          </YStack>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </XStack>
                <Text color={colors.muted} fontSize={12}>
                  {settings.disableDifficulty === 'easy'
                    ? 'Blocking can be disabled instantly'
                    : settings.disableDifficulty === 'medium'
                      ? '30-second wait before disabling'
                      : 'Blocking cannot be disabled once activated'}
                </Text>
              </GlowCard>
            </Animated.View>
          )}

          {/* Info tip */}
          <FadeInView delay={isAuthorized && hasApps ? 600 : 300}>
            <GlowCard glass size="sm" marginBottom={16}>
              <XStack alignItems="center" gap={12}>
                <IconBadge size={32}>
                  <Info size={14} color={colors.accent} />
                </IconBadge>
                <Text color={colors.secondary} fontSize={13} lineHeight={19} flex={1}>
                  Blocked apps require completing {settings.challengesRequired} brain
                  challenge{settings.challengesRequired > 1 ? 's' : ''} before opening.
                </Text>
              </XStack>
            </GlowCard>
          </FadeInView>

          {/* How it works */}
          <FadeInView delay={isAuthorized && hasApps ? 700 : 400}>
            <ListCard noteStyle>
              <Text color={colors.text} fontSize={16} fontWeight="600" marginBottom={8}>
                How it works
              </Text>
              <Text color={colors.secondary} fontSize={14} lineHeight={21}>
                BrainLock uses iOS Screen Time to actually block apps on your device.
                When you try to open a blocked app during active hours, you'll need to
                complete a brain challenge first.
              </Text>
            </ListCard>
          </FadeInView>

          <View height={20} />
        </Animated.View>
      </ScrollView>

      <TimePickerSheet
        visible={pickerTarget === 'start'}
        title="Start Time"
        subtitle="Select when blocking begins"
        value={settings.activeHoursStart}
        onChange={(h) => updateSettings({ activeHoursStart: h })}
        onClose={() => setPickerTarget(null)}
      />
      <TimePickerSheet
        visible={pickerTarget === 'end'}
        title="End Time"
        subtitle="Select when blocking ends"
        value={settings.activeHoursEnd}
        onChange={(h) => updateSettings({ activeHoursEnd: h })}
        onClose={() => setPickerTarget(null)}
      />

      {/* Countdown modal for medium difficulty */}
      <Modal
        visible={countdownActive}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <DisableCountdownScreen
          remainingSeconds={countdownRemaining}
          totalSeconds={COUNTDOWN_SECONDS}
          onCancel={handleCancelCountdown}
        />
      </Modal>
    </YStack>
  );
}
