import { TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight, Shield,
  CheckCircle2, Circle as CircleIcon, Gamepad2, X,
  Lock, Unlock, Timer, Play,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, UNLOCK_CREDIT_COST } from '../../src/store/useStore';
import { hapticLight } from '../../src/utils/haptics';
import { FadeInView } from '../../src/components/ui/AnimatedElements';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { maybeShowReviewPrompt } from '../../src/services/review';
import { track, Events } from '../../src/services/analytics';

// ── Helpers ──────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || '';
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
  default: {},
});

const heroShadow = Platform.select({
  ios: {
    shadowColor: '#8B4205',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  android: { elevation: 8 },
  default: {},
});

// ── Getting Started Card ─────────────────────────────────────
function GettingStartedCard() {
  const {
    progress,
    settings,
    dailyEarnTasksCompleted,
    setupGuideComplete,
    completeSetupGuide,
  } = useStore();
  const { colors, isDark } = useThemeColors();

  const isBlocking = settings.screenTimeScheduleEnabled && settings.screenTimeAppCount > 0;

  const steps = [
    {
      title: 'Complete a challenge',
      description: 'Mental or physical challenges',
      done: progress.gamesPlayed > 0 || dailyEarnTasksCompleted > 0,
      onPress: () => {
        hapticLight();
        router.push('/(tabs)/games');
      },
    },
    {
      title: 'Set up app blocking',
      description: 'Choose apps to lock until you earn time',
      done: isBlocking,
      onPress: () => {
        hapticLight();
        router.push('/(tabs)/lock');
      },
    },
    {
      title: 'Unlock your apps',
      description: 'Spend credits to unlock your apps',
      done: isBlocking && dailyEarnTasksCompleted >= settings.challengesRequired,
      onPress: () => {
        hapticLight();
        router.push('/(tabs)/lock');
      },
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  useEffect(() => {
    if (allDone && !setupGuideComplete) {
      completeSetupGuide();
    }
  }, [allDone, setupGuideComplete]);

  if (setupGuideComplete) return null;

  return (
    <View
      borderRadius={12}
      overflow="hidden"
      marginBottom={20}
      style={cardShadow}
    >
      <LinearGradient
        colors={isDark ? [colors.card, colors.cardAlt] : ['#FFFFFF', '#FDFAF5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          padding: 24,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(0,0,0,0.04)',
        }}
      >
        <XStack justifyContent="space-between" alignItems="center" marginBottom={16}>
          <XStack alignItems="center" gap={10}>
            <View
              width={32}
              height={32}
              borderRadius={10}
              backgroundColor={`${colors.accent}12`}
              justifyContent="center"
              alignItems="center"
            >
              <Gamepad2 size={16} color={colors.accent} />
            </View>
            <Text color={colors.text} fontSize={16} fontWeight="600" letterSpacing={-0.2}>
              Getting Started
            </Text>
          </XStack>
          <XStack alignItems="center" gap={8}>
            <Text color={colors.muted} fontSize={12} fontWeight="600">
              {completedCount}/{steps.length}
            </Text>
            <TouchableOpacity
              onPress={() => {
                hapticLight();
                completeSetupGuide();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={colors.muted} />
            </TouchableOpacity>
          </XStack>
        </XStack>

        {steps.map((step, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.7}
            onPress={step.done ? undefined : step.onPress}
            disabled={step.done}
          >
            <XStack
              alignItems="center"
              gap={12}
              paddingVertical={12}
              opacity={step.done ? 0.45 : 1}
              {...(i < steps.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: isDark ? colors.border : 'rgba(0,0,0,0.04)',
              })}
            >
              {step.done ? (
                <CheckCircle2 size={20} color={colors.success} fill={`${colors.success}30`} />
              ) : (
                <CircleIcon size={20} color={colors.border} />
              )}
              <YStack flex={1}>
                <Text
                  color={step.done ? colors.muted : colors.text}
                  fontSize={14}
                  fontWeight="600"
                  letterSpacing={-0.1}
                  textDecorationLine={step.done ? 'line-through' : 'none'}
                >
                  {step.title}
                </Text>
                <Text color={colors.muted} fontSize={12} marginTop={1}>
                  {step.description}
                </Text>
              </YStack>
              {!step.done && <ChevronRight size={16} color={colors.muted} />}
            </XStack>
          </TouchableOpacity>
        ))}
      </LinearGradient>
    </View>
  );
}

// ── Hero Card ────────────────────────────────────────────────
function renderHero({
  gradientColors,
  onPress,
  children,
}: {
  gradientColors: string[];
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View
        borderRadius={12}
        overflow="hidden"
        marginBottom={20}
        style={heroShadow}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 24,
            borderRadius: 12,
          }}
        >
          {children}
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

// ── Component ────────────────────────────────────────────────

function useUnlockCountdown(unlockExpiresAt: number | null, appsUnlocked: boolean) {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!appsUnlocked || !unlockExpiresAt) {
      setRemainingMs(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, unlockExpiresAt - Date.now());
      setRemainingMs(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [unlockExpiresAt, appsUnlocked]);

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  return { remainingMs, formatted };
}

export default function HomeScreen() {
  const {
    settings, userName, appsUnlocked, setupGuideComplete,
    credits, unlockExpiresAt, spendCredits, checkUnlockExpiry,
    canEarnToday, setShowPaywall,
  } = useStore();
  const insets = useSafeAreaInsets();
  const { colors, isDark, gradients } = useThemeColors();

  const isBlocking = settings.screenTimeScheduleEnabled && settings.screenTimeAppCount > 0;
  const firstName = getFirstName(userName);
  const greeting = getGreeting();
  const { formatted: countdownText } = useUnlockCountdown(unlockExpiresAt, appsUnlocked);

  // Check unlock expiry periodically
  useEffect(() => {
    const id = setInterval(checkUnlockExpiry, 30000);
    return () => clearInterval(id);
  }, [checkUnlockExpiry]);

  // Ask for a review shortly after home first appears (once per install)
  useEffect(() => {
    const id = setTimeout(() => { maybeShowReviewPrompt(); }, 1500);
    return () => clearTimeout(id);
  }, []);

  const handleOpenGames = () => {
    hapticLight();
    if (!canEarnToday()) {
      setShowPaywall(true);
      return;
    }
    router.push('/(tabs)/games');
  };

  const handleGoToBlockApps = () => {
    hapticLight();
    router.push('/(tabs)/lock');
  };

  const handleUnlockApps = () => {
    hapticLight();
    track(Events.UnlockAttempted, { credits_available: credits, cost: UNLOCK_CREDIT_COST, source: 'home' });
    spendCredits();
  };

  const heroColorsLocked = isDark ? gradients.heroDeep : gradients.heroPrimary;
  const heroColorsUnlocked = gradients.heroGreen;
  const canUnlock = credits >= UNLOCK_CREDIT_COST;
  const creditsNeeded = Math.max(0, UNLOCK_CREDIT_COST - credits);

  return (
    <YStack flex={1} backgroundColor={colors.background}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
      >
        {/* ── Greeting ── */}
        <FadeInView delay={0}>
          <Text
            color={colors.muted}
            fontSize={13}
            fontWeight="500"
            letterSpacing={0.4}
            textTransform="uppercase"
            marginBottom={2}
          >
            {greeting}
          </Text>
          <Text
            color={colors.text}
            fontSize={30}
            fontWeight="700"
            letterSpacing={-0.8}
            marginBottom={24}
          >
            {firstName || 'Welcome'}
          </Text>
        </FadeInView>

        {/* ── Main Hero CTA ── */}
        <FadeInView delay={100}>
          {isBlocking && appsUnlocked ? (
            renderHero({
              gradientColors: heroColorsUnlocked,
              onPress: handleGoToBlockApps,
              children: (
                <XStack alignItems="center" gap={18} width="100%">
                  <View
                    width={56}
                    height={56}
                    borderRadius={12}
                    backgroundColor="rgba(255,255,255,0.12)"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Unlock size={26} color="#FFFFFF" />
                  </View>
                  <YStack flex={1}>
                    <Text color="#FFFFFF" fontSize={21} fontWeight="700" letterSpacing={-0.4}>
                      Apps Unlocked
                    </Text>
                    <XStack alignItems="center" gap={6} marginTop={4}>
                      <Timer size={13} color="rgba(255,255,255,0.6)" />
                      <Text color="rgba(255,255,255,0.6)" fontSize={13} letterSpacing={-0.1}>
                        {countdownText} remaining
                      </Text>
                    </XStack>
                  </YStack>
                </XStack>
              ),
            })
          ) : isBlocking && canUnlock ? (
            renderHero({
              gradientColors: heroColorsLocked,
              onPress: handleUnlockApps,
              children: (
                <>
                  <XStack alignItems="center" gap={18} width="100%">
                    <View
                      width={56}
                      height={56}
                      borderRadius={12}
                      backgroundColor="rgba(255,255,255,0.12)"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Lock size={26} color="#FFFFFF" />
                    </View>
                    <YStack flex={1}>
                      <Text color="#FFFFFF" fontSize={21} fontWeight="700" letterSpacing={-0.4}>
                        Apps Locked
                      </Text>
                      <Text color="rgba(255,255,255,0.6)" fontSize={13} marginTop={4} letterSpacing={-0.1}>
                        You have {credits} credits
                      </Text>
                    </YStack>
                  </XStack>

                  <View
                    marginTop={18}
                    backgroundColor="rgba(255,255,255,0.22)"
                    borderRadius={12}
                    paddingVertical={14}
                    alignItems="center"
                  >
                    <XStack alignItems="center" gap={6}>
                      <Unlock size={14} color="#FFFFFF" />
                      <Text color="#FFFFFF" fontSize={14} fontWeight="700" letterSpacing={-0.1}>
                        Unlock Apps
                      </Text>
                    </XStack>
                  </View>
                </>
              ),
            })
          ) : isBlocking ? (
            renderHero({
              gradientColors: heroColorsLocked,
              onPress: handleOpenGames,
              children: (
                <>
                  <XStack alignItems="center" gap={18} width="100%">
                    <View
                      width={56}
                      height={56}
                      borderRadius={12}
                      backgroundColor="rgba(255,255,255,0.12)"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Lock size={26} color="#FFFFFF" />
                    </View>
                    <YStack flex={1}>
                      <Text color="#FFFFFF" fontSize={21} fontWeight="700" letterSpacing={-0.4}>
                        Apps Locked
                      </Text>
                      <Text color="rgba(255,255,255,0.6)" fontSize={13} marginTop={4} letterSpacing={-0.1}>
                        {creditsNeeded} more credits needed · complete a challenge
                      </Text>
                    </YStack>
                  </XStack>

                  <View
                    marginTop={18}
                    backgroundColor="rgba(255,255,255,0.18)"
                    borderRadius={12}
                    paddingVertical={14}
                    alignItems="center"
                  >
                    <XStack alignItems="center" gap={6}>
                      <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                      <Text color="#FFFFFF" fontSize={14} fontWeight="700" letterSpacing={-0.1}>
                        Earn credits
                      </Text>
                    </XStack>
                  </View>
                </>
              ),
            })
          ) : (
            renderHero({
              gradientColors: heroColorsLocked,
              onPress: handleGoToBlockApps,
              children: (
                <>
                  <XStack alignItems="center" gap={18} width="100%">
                    <View
                      width={56}
                      height={56}
                      borderRadius={12}
                      backgroundColor="rgba(255,255,255,0.12)"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Shield size={26} color="#FFFFFF" />
                    </View>
                    <YStack flex={1}>
                      <Text color="#FFFFFF" fontSize={21} fontWeight="700" letterSpacing={-0.4}>
                        Block distracting apps
                      </Text>
                      <Text color="rgba(255,255,255,0.6)" fontSize={13} marginTop={4} letterSpacing={-0.1}>
                        Start here to take back your time
                      </Text>
                    </YStack>
                  </XStack>

                  <View
                    marginTop={18}
                    backgroundColor="rgba(255,255,255,0.18)"
                    borderRadius={12}
                    paddingVertical={14}
                    alignItems="center"
                  >
                    <XStack alignItems="center" gap={6}>
                      <Shield size={14} color="#FFFFFF" />
                      <Text color="#FFFFFF" fontSize={14} fontWeight="700" letterSpacing={-0.1}>
                        Set up blocking
                      </Text>
                    </XStack>
                  </View>
                </>
              ),
            })
          )}
        </FadeInView>

        {/* ── Getting Started Guide ── */}
        {!setupGuideComplete && (
          <FadeInView delay={200}>
            <GettingStartedCard />
          </FadeInView>
        )}
      </ScrollView>
    </YStack>
  );
}
