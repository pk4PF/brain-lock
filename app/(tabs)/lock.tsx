import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
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
import { Shield, Info, Clock, ChevronRight, CheckCircle, AlertTriangle, Check } from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { GlowCard, ListCard } from '../../src/components/ui/GlowCard';
import { SectionTitle } from '../../src/components/ui/SectionTitle';
import { IconBadge } from '../../src/components/ui/IconBadge';
import { FadeInView, PulsingIcon } from '../../src/components/ui/AnimatedElements';
import { hapticLight, hapticMedium, hapticSuccess } from '../../src/utils/haptics';
import { ScreenTime } from 'screen-time-module';

const AMBER = '#F5A623';
const AMBER_DIM = 'rgba(245,166,35,0.08)';
const LIGHT_BG = '#F8F9FB';
const BORDER = '#E5E7EB';
const GREEN = '#22C55E';

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
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify().damping(14)}
      exiting={FadeOut.duration(250)}
      style={{
        backgroundColor: '#ECFDF5',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#A7F3D0',
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
      <Text color="#065F46" fontSize={14} fontWeight="600" flex={1}>
        {message}
      </Text>
    </Animated.View>
  );
}

export default function LockScreen() {
  const { settings, updateSettings } = useStore();
  const insets = useSafeAreaInsets();

  const [authStatus, setAuthStatus] = useState<'approved' | 'denied' | 'notDetermined' | 'unavailable'>('notDetermined');
  const [appCount, setAppCount] = useState(settings.screenTimeAppCount);
  const [loading, setLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [unblockLoading, setUnblockLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);

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
      const result = await ScreenTime.requestAuthorization();
      setAuthStatus(result);
      updateSettings({ screenTimeAuthorized: result === 'approved' });
      if (result === 'approved') {
        hapticSuccess();
      } else if (result === 'denied') {
        Alert.alert(
          'Permission Denied',
          'BrainLock needs Screen Time access to block apps. You can enable it in Settings > Screen Time > BrainLock.'
        );
      }
    } catch {
      Alert.alert('Error', 'Could not request Screen Time permission. Please try again.');
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
        0
      );
      updateSettings({ screenTimeScheduleEnabled: true });
      hapticSuccess();
      showToast(`Schedule active: ${settings.activeHoursStart.toString().padStart(2, '0')}:00 – ${settings.activeHoursEnd.toString().padStart(2, '0')}:00`);
    } catch {
      Alert.alert('Error', 'Could not set schedule. Please try again.');
    } finally {
      setScheduleLoading(false);
    }
  }, [settings.activeHoursStart, settings.activeHoursEnd]);

  const handleDisableSchedule = useCallback(async () => {
    setScheduleLoading(true);
    hapticLight();
    try {
      await ScreenTime.setScheduleEnabled(false);
      await ScreenTime.removeShieldNow();
      updateSettings({ screenTimeScheduleEnabled: false });
      showToast('Schedule disabled');
    } catch {
      Alert.alert('Error', 'Could not disable schedule.');
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  const handleBlockNow = useCallback(async () => {
    setBlockLoading(true);
    hapticMedium();
    try {
      await ScreenTime.applyShieldNow();
      hapticSuccess();
      showToast('Apps are now blocked');
    } catch {
      Alert.alert('Error', 'Could not apply shields.');
    } finally {
      setBlockLoading(false);
    }
  }, []);

  const handleUnblockNow = useCallback(async () => {
    setUnblockLoading(true);
    hapticLight();
    try {
      await ScreenTime.removeShieldNow();
      hapticSuccess();
      showToast('All blocks removed');
    } catch {
      Alert.alert('Error', 'Could not remove shields.');
    } finally {
      setUnblockLoading(false);
    }
  }, []);

  const isAuthorized = authStatus === 'approved';
  const hasApps = appCount > 0;

  return (
    <YStack flex={1} backgroundColor={LIGHT_BG}>
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
              color="#1A1A2E"
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

          {/* Status Card */}
          <FadeInView delay={100}>
            <GlowCard accent elevated marginBottom={16} padding={0} overflow="hidden">
              <LinearGradient
                colors={['#FFFFFF', '#FFF8EE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 24, alignItems: 'center' }}
              >
                <PulsingIcon size={56}>
                  <Shield size={26} color="#FFFFFF" />
                </PulsingIcon>
                <Text color="#1A1A2E" fontSize={20} fontWeight="700" marginTop={14}>
                  {!isAuthorized
                    ? 'Set Up App Blocking'
                    : hasApps
                      ? 'App Blocking Active'
                      : 'Choose Apps to Block'}
                </Text>
                <Text color="#6B7280" fontSize={14} marginTop={4} textAlign="center">
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
                  <Text color="#6B7280" fontSize={13} lineHeight={19} flex={1}>
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
                      <IconBadge size={40} color={isAuthorized ? GREEN : AMBER} glow={isAuthorized}>
                        {isAuthorized ? (
                          <CheckCircle size={18} color={GREEN} />
                        ) : loading ? (
                          <ActivityIndicator size="small" color={AMBER} />
                        ) : (
                          <Shield size={18} color={AMBER} />
                        )}
                      </IconBadge>
                      <YStack>
                        <Text color="#1A1A2E" fontSize={16} fontWeight="600">
                          {isAuthorized ? 'Screen Time Enabled' : 'Enable Screen Time'}
                        </Text>
                        <Text color="#9CA3AF" fontSize={13} marginTop={2}>
                          {isAuthorized
                            ? 'BrainLock can manage app access'
                            : 'Required to block apps on your device'}
                        </Text>
                      </YStack>
                    </XStack>
                    {!isAuthorized && !loading && (
                      <ChevronRight size={20} color="#9CA3AF" />
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
                      <IconBadge size={40} color={hasApps ? GREEN : AMBER} glow={hasApps}>
                        {hasApps ? (
                          <CheckCircle size={18} color={GREEN} />
                        ) : (
                          <Shield size={18} color={AMBER} />
                        )}
                      </IconBadge>
                      <YStack>
                        <Text color="#1A1A2E" fontSize={16} fontWeight="600">
                          {hasApps ? `${appCount} Selected` : 'Select Apps to Block'}
                        </Text>
                        <Text color="#9CA3AF" fontSize={13} marginTop={2}>
                          {hasApps
                            ? 'Tap to change your selection'
                            : 'Opens the iOS app picker'}
                        </Text>
                      </YStack>
                    </XStack>
                    <ChevronRight size={20} color="#9CA3AF" />
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
              <GlowCard accent marginBottom={12}>
                <XStack alignItems="center" gap={12} marginBottom={16}>
                  <IconBadge size={36}>
                    <Clock size={16} color={AMBER} />
                  </IconBadge>
                  <Text color="#1A1A2E" fontSize={16} fontWeight="600">
                    Active Hours
                  </Text>
                </XStack>
                <Text color="#6B7280" fontSize={13} marginBottom={16}>
                  Apps will be blocked during these hours
                </Text>
                <XStack justifyContent="center" alignItems="center" gap={16} marginBottom={20}>
                  <YStack alignItems="center" gap={4}>
                    <Text color="#9CA3AF" fontSize={11} fontWeight="600" textTransform="uppercase" letterSpacing={1}>
                      From
                    </Text>
                    <Text color="#1A1A2E" fontSize={28} fontWeight="700">
                      {settings.activeHoursStart.toString().padStart(2, '0')}:00
                    </Text>
                  </YStack>
                  <Text color="#9CA3AF" fontSize={16}>to</Text>
                  <YStack alignItems="center" gap={4}>
                    <Text color="#9CA3AF" fontSize={11} fontWeight="600" textTransform="uppercase" letterSpacing={1}>
                      Until
                    </Text>
                    <Text color="#1A1A2E" fontSize={28} fontWeight="700">
                      {settings.activeHoursEnd.toString().padStart(2, '0')}:00
                    </Text>
                  </YStack>
                </XStack>
                <Text color="#9CA3AF" fontSize={12} textAlign="center" marginBottom={16}>
                  Change hours in the Profile tab
                </Text>

                {settings.screenTimeScheduleEnabled ? (
                  <AnimatedButton onPress={handleDisableSchedule} disabled={scheduleLoading}>
                    <YStack
                      paddingVertical={14}
                      borderRadius={14}
                      backgroundColor="#FEE2E2"
                      borderWidth={1}
                      borderColor="#FECACA"
                      alignItems="center"
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
                ) : (
                  <AnimatedButton onPress={handleApplySchedule} disabled={scheduleLoading}>
                    <LinearGradient
                      colors={[AMBER, '#FF6B35']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 14, overflow: 'hidden' }}
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
              </GlowCard>
            </Animated.View>
          )}

          {/* Quick Actions */}
          {isAuthorized && hasApps && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400).springify().damping(16)}
              exiting={FadeOutUp.duration(250)}
            >
              <SectionTitle title="Quick Actions" />
              <XStack gap={10} marginBottom={20}>
                <AnimatedButton
                  onPress={handleBlockNow}
                  disabled={blockLoading}
                  style={{ flex: 1 }}
                >
                  <GlowCard accent padding={16} alignItems="center">
                    <IconBadge size={36} glow>
                      {blockLoading ? (
                        <ActivityIndicator size="small" color={AMBER} />
                      ) : (
                        <Shield size={16} color={AMBER} />
                      )}
                    </IconBadge>
                    <Text color="#1A1A2E" fontSize={14} fontWeight="600" marginTop={10}>
                      Block Now
                    </Text>
                    <Text color="#9CA3AF" fontSize={11} marginTop={2} textAlign="center">
                      Immediately block
                    </Text>
                  </GlowCard>
                </AnimatedButton>
                <AnimatedButton
                  onPress={handleUnblockNow}
                  disabled={unblockLoading}
                  style={{ flex: 1 }}
                >
                  <GlowCard padding={16} alignItems="center">
                    <IconBadge size={36}>
                      {unblockLoading ? (
                        <ActivityIndicator size="small" color="#9CA3AF" />
                      ) : (
                        <Shield size={16} color="#9CA3AF" />
                      )}
                    </IconBadge>
                    <Text color="#1A1A2E" fontSize={14} fontWeight="600" marginTop={10}>
                      Unblock All
                    </Text>
                    <Text color="#9CA3AF" fontSize={11} marginTop={2} textAlign="center">
                      Remove all blocks
                    </Text>
                  </GlowCard>
                </AnimatedButton>
              </XStack>
            </Animated.View>
          )}

          {/* Info tip */}
          <FadeInView delay={isAuthorized && hasApps ? 600 : 300}>
            <GlowCard glass size="sm" marginBottom={16}>
              <XStack alignItems="center" gap={12}>
                <IconBadge size={32}>
                  <Info size={14} color={AMBER} />
                </IconBadge>
                <Text color="#6B7280" fontSize={13} lineHeight={19} flex={1}>
                  Blocked apps require completing {settings.challengesRequired} brain
                  challenge{settings.challengesRequired > 1 ? 's' : ''} before opening.
                </Text>
              </XStack>
            </GlowCard>
          </FadeInView>

          {/* How it works */}
          <FadeInView delay={isAuthorized && hasApps ? 700 : 400}>
            <ListCard noteStyle>
              <Text color="#1A1A2E" fontSize={16} fontWeight="600" marginBottom={8}>
                How it works
              </Text>
              <Text color="#6B7280" fontSize={14} lineHeight={21}>
                BrainLock uses iOS Screen Time to actually block apps on your device.
                When you try to open a blocked app during active hours, you'll need to
                complete a brain challenge first.
              </Text>
            </ListCard>
          </FadeInView>

          <View height={20} />
        </Animated.View>
      </ScrollView>
    </YStack>
  );
}
