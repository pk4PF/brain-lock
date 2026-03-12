import { TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import {
  ChevronRight, Shield, Brain,
  Calculator, Grid3x3, Type, BookOpen, Zap, Palette,
  Flame, Trophy, Play, CheckCircle2, Circle as CircleIcon, Gamepad2, X,
} from 'lucide-react-native';
import { useEffect } from 'react';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { GAMES, GameType } from '../../src/constants/games';
import { hapticLight } from '../../src/utils/haptics';
import { FadeInView } from '../../src/components/ui/AnimatedElements';
import { useThemeColors } from '../../src/hooks/useThemeColors';

// ── Progress Ring ────────────────────────────────────────────
function ProgressRing({ percent, size = 100, accentColor }: { percent: number; size?: number; accentColor?: string }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const color = accentColor || '#FFD54F';

  return (
    <View width={size} height={size} alignItems="center" justifyContent="center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text color="#FFFFFF" fontSize={22} fontWeight="800">
        {percent}%
      </Text>
    </View>
  );
}

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

const GAME_ICONS: Record<GameType, { icon: (s: number, c: string) => React.ReactNode }> = {
  math: { icon: (s, c) => <Calculator size={s} color={c} /> },
  memory: { icon: (s, c) => <Grid3x3 size={s} color={c} /> },
  wordscramble: { icon: (s, c) => <Type size={s} color={c} /> },
  speedread: { icon: (s, c) => <BookOpen size={s} color={c} /> },
  reaction: { icon: (s, c) => <Zap size={s} color={c} /> },
  colormatch: { icon: (s, c) => <Palette size={s} color={c} /> },
};

// ── Game Tile ────────────────────────────────────────────────
function GameTile({
  gameKey,
  onPress,
  delay,
}: {
  gameKey: GameType;
  onPress: () => void;
  delay: number;
}) {
  const game = GAMES[gameKey];
  const iconConfig = GAME_ICONS[gameKey];
  const { colors, isDark } = useThemeColors();

  return (
    <FadeInView delay={delay}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={{
          width: '100%',
          borderRadius: 20,
          overflow: 'hidden',
          shadowColor: isDark ? game.color : '#8B7355',
          shadowOffset: { width: 0, height: isDark ? 4 : 2 },
          shadowOpacity: isDark ? 0.2 : 0.08,
          shadowRadius: isDark ? 16 : 8,
          elevation: isDark ? 4 : 2,
        }}
      >
        <LinearGradient
          colors={isDark ? game.gradient : [colors.card, colors.cardAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 16,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: isDark ? `${game.color}20` : colors.border,
            minHeight: 155,
            justifyContent: 'center',
          }}
        >
          <YStack alignItems="center" gap={10}>
            {/* Icon container with glow */}
            <View
              width={56}
              height={56}
              borderRadius={28}
              backgroundColor={`${game.color}${isDark ? '20' : '15'}`}
              justifyContent="center"
              alignItems="center"
              borderWidth={1}
              borderColor={`${game.color}${isDark ? '30' : '10'}`}
            >
              {iconConfig.icon(26, game.color)}
            </View>
            <YStack alignItems="center" gap={2}>
              <Text
                color={isDark ? '#F0F0F5' : colors.text}
                fontSize={15}
                fontWeight="700"
                textAlign="center"
              >
                {game.title}
              </Text>
              <Text
                color={isDark ? 'rgba(255,255,255,0.5)' : colors.muted}
                fontSize={11}
                textAlign="center"
              >
                {game.description}
              </Text>
            </YStack>
          </YStack>
        </LinearGradient>
      </TouchableOpacity>
    </FadeInView>
  );
}

// ── Stat Block ───────────────────────────────────────────────
function StatBlock({
  value,
  label,
  icon,
  color,
}: {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  color: string;
}) {
  const { colors, isDark } = useThemeColors();

  return (
    <YStack
      flex={1}
      backgroundColor={isDark ? colors.card : undefined}
      borderRadius={16}
      padding={16}
      alignItems="center"
      gap={6}
      borderWidth={isDark ? 1 : 0}
      borderColor={isDark ? colors.border : undefined}
      {...(!isDark && {
        backgroundColor: `${color}15`,
      })}
    >
      <View
        width={32}
        height={32}
        borderRadius={16}
        backgroundColor={`${color}${isDark ? '18' : '20'}`}
        justifyContent="center"
        alignItems="center"
      >
        {icon}
      </View>
      <Text
        color={isDark ? color : color}
        fontSize={26}
        fontWeight="800"
        letterSpacing={-0.5}
      >
        {value}
      </Text>
      <Text
        color={isDark ? colors.muted : `${color}CC`}
        fontSize={11}
        fontWeight="600"
      >
        {label}
      </Text>
    </YStack>
  );
}

// ── Getting Started Card ─────────────────────────────────────
function GettingStartedCard() {
  const {
    progress,
    settings,
    dailyGamesCompleted,
    setupGuideComplete,
    completeSetupGuide,
  } = useStore();
  const { colors, isDark } = useThemeColors();

  const isBlocking = settings.screenTimeScheduleEnabled && settings.screenTimeAppCount > 0;

  const steps = [
    {
      title: 'Play your first game',
      description: 'Try a quick brain challenge',
      done: progress.gamesPlayed > 0,
      onPress: () => {
        hapticLight();
        const games = settings.enabledGames;
        const random = games[Math.floor(Math.random() * games.length)];
        router.push(`/games/${random}`);
      },
    },
    {
      title: 'Set up app blocking',
      description: 'Choose apps to lock until you train',
      done: isBlocking,
      onPress: () => {
        hapticLight();
        router.push('/(tabs)/lock');
      },
    },
    {
      title: 'Complete a daily challenge',
      description: 'Unlock your apps by playing',
      done: isBlocking && dailyGamesCompleted >= settings.challengesRequired,
      onPress: () => {
        hapticLight();
        const games = settings.enabledGames;
        const random = games[Math.floor(Math.random() * games.length)];
        router.push(`/games/${random}`);
      },
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  // Auto-dismiss when all steps are complete
  useEffect(() => {
    if (allDone && !setupGuideComplete) {
      completeSetupGuide();
    }
  }, [allDone, setupGuideComplete]);

  if (setupGuideComplete) return null;

  return (
    <View
      backgroundColor={isDark ? colors.card : colors.card}
      borderRadius={20}
      padding={20}
      marginBottom={20}
      borderWidth={1}
      borderColor={isDark ? colors.border : 'rgba(0,0,0,0.04)'}
      shadowColor={isDark ? 'rgba(0,0,0,0.6)' : '#8B7355'}
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={isDark ? 0.3 : 0.06}
      shadowRadius={12}
      elevation={isDark ? 3 : 2}
    >
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center" marginBottom={16}>
        <XStack alignItems="center" gap={10}>
          <View
            width={32}
            height={32}
            borderRadius={10}
            backgroundColor={`${colors.accent}15`}
            justifyContent="center"
            alignItems="center"
          >
            <Gamepad2 size={16} color={colors.accent} />
          </View>
          <Text color={colors.text} fontSize={17} fontWeight="700">
            Getting Started
          </Text>
        </XStack>
        <XStack alignItems="center" gap={8}>
          <View
            backgroundColor={`${colors.accent}15`}
            borderRadius={10}
            paddingHorizontal={10}
            paddingVertical={4}
          >
            <Text color={colors.accent} fontSize={12} fontWeight="700">
              {completedCount} of {steps.length}
            </Text>
          </View>
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

      {/* Steps */}
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
            opacity={step.done ? 0.5 : 1}
            {...(i < steps.length - 1 && {
              borderBottomWidth: 1,
              borderBottomColor: isDark ? colors.border : 'rgba(0,0,0,0.04)',
            })}
          >
            {step.done ? (
              <CheckCircle2 size={22} color={colors.success} fill={`${colors.success}30`} />
            ) : (
              <CircleIcon size={22} color={isDark ? colors.border : colors.muted} />
            )}
            <YStack flex={1}>
              <Text
                color={step.done ? colors.muted : colors.text}
                fontSize={15}
                fontWeight="600"
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
    </View>
  );
}

// ── Component ────────────────────────────────────────────────

export default function HomeScreen() {
  const { settings, userName, progress, dailyGamesCompleted, appsUnlocked, setupGuideComplete } = useStore();
  const insets = useSafeAreaInsets();
  const { colors, isDark, gradients } = useThemeColors();

  const isBlocking = settings.screenTimeScheduleEnabled && settings.screenTimeAppCount > 0;
  const firstName = getFirstName(userName);
  const greeting = getGreeting();
  const challengesRequired = settings.challengesRequired;
  const remaining = Math.max(0, challengesRequired - dailyGamesCompleted);
  const progressPercent = challengesRequired > 0
    ? Math.round((dailyGamesCompleted / challengesRequired) * 100)
    : 0;

  // ── Handlers ──

  const handleStartWorkout = () => {
    hapticLight();
    const games = settings.enabledGames;
    const random = games[Math.floor(Math.random() * games.length)];
    router.push(`/games/${random}`);
  };

  const handlePlayGame = (key: GameType) => {
    hapticLight();
    router.push(`/games/${key}`);
  };

  const handleGoToBlockApps = () => {
    hapticLight();
    router.push('/(tabs)/lock');
  };

  // ── Render ──

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
            fontSize={14}
            fontWeight="500"
            marginBottom={4}
          >
            {greeting}
          </Text>
          <Text
            color={colors.text}
            fontSize={32}
            fontWeight="800"
            letterSpacing={-0.8}
            marginBottom={24}
          >
            {firstName || 'Welcome'}
          </Text>
        </FadeInView>

        {/* ── Main Hero Card ── */}
        <FadeInView delay={150}>
          {isBlocking && appsUnlocked ? (
            /* Apps unlocked — gold success hero */
            <TouchableOpacity activeOpacity={0.9} onPress={handleStartWorkout}>
              <View
                borderRadius={24}
                overflow="hidden"
                marginBottom={20}
                shadowColor={isDark ? colors.accent : '#C47A0A'}
                shadowOffset={{ width: 0, height: isDark ? 8 : 4 }}
                shadowOpacity={isDark ? 0.2 : 0.15}
                shadowRadius={isDark ? 24 : 16}
                elevation={isDark ? 6 : 4}
              >
                <LinearGradient
                  colors={gradients.heroPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 28,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: isDark ? `${colors.accent}25` : 'rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Decorative glow */}
                  {isDark && (
                    <View
                      position="absolute"
                      top={-40}
                      right={-40}
                      width={160}
                      height={160}
                      borderRadius={80}
                      backgroundColor={`${colors.accent}06`}
                    />
                  )}
                  <XStack alignItems="center" gap={20} width="100%">
                    <ProgressRing percent={100} size={90} accentColor={colors.accent} />
                    <YStack flex={1}>
                      <Text
                        color={isDark ? '#FFFFFF' : '#FFFFFF'}
                        fontSize={24}
                        fontWeight="800"
                        letterSpacing={-0.3}
                      >
                        Apps Unlocked
                      </Text>
                      <Text
                        color="rgba(255,255,255,0.6)"
                        fontSize={13}
                        lineHeight={18}
                        marginTop={6}
                      >
                        All challenges completed for today
                      </Text>
                    </YStack>
                  </XStack>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          ) : isBlocking ? (
            /* Blocking active — play games to unlock */
            <TouchableOpacity activeOpacity={0.9} onPress={handleStartWorkout}>
              <View
                borderRadius={24}
                overflow="hidden"
                marginBottom={20}
                shadowColor={isDark ? colors.accent : '#C47A0A'}
                shadowOffset={{ width: 0, height: isDark ? 8 : 4 }}
                shadowOpacity={isDark ? 0.2 : 0.15}
                shadowRadius={isDark ? 24 : 16}
                elevation={isDark ? 6 : 4}
              >
                <LinearGradient
                  colors={gradients.heroPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 28,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: isDark ? `${colors.accent}25` : 'rgba(0,0,0,0.04)',
                  }}
                >
                  {isDark && (
                    <View
                      position="absolute"
                      top={-40}
                      right={-40}
                      width={160}
                      height={160}
                      borderRadius={80}
                      backgroundColor={`${colors.accent}06`}
                    />
                  )}
                  <XStack alignItems="center" gap={20} width="100%">
                    <ProgressRing percent={progressPercent} size={90} accentColor={colors.accent} />
                    <YStack flex={1}>
                      <Text
                        color="#FFFFFF"
                        fontSize={24}
                        fontWeight="800"
                        letterSpacing={-0.3}
                      >
                        Apps Locked
                      </Text>
                      <Text
                        color="rgba(255,255,255,0.6)"
                        fontSize={13}
                        lineHeight={18}
                        marginTop={6}
                      >
                        {remaining} more game{remaining > 1 ? 's' : ''} to unlock
                      </Text>
                    </YStack>
                  </XStack>

                  {/* Integrated CTA */}
                  <View
                    marginTop={20}
                    backgroundColor={`${colors.accent}18`}
                    borderRadius={14}
                    paddingVertical={12}
                    paddingHorizontal={20}
                    alignItems="center"
                    borderWidth={1}
                    borderColor={`${colors.accent}25`}
                  >
                    <XStack alignItems="center" gap={8}>
                      <Play size={16} color={colors.accent} fill={colors.accent} />
                      <Text color={colors.accent} fontSize={14} fontWeight="700">
                        Start Challenge
                      </Text>
                    </XStack>
                  </View>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          ) : (
            /* No blocking — train your brain freely */
            <TouchableOpacity activeOpacity={0.9} onPress={handleStartWorkout}>
              <View
                borderRadius={24}
                overflow="hidden"
                marginBottom={20}
                shadowColor={isDark ? colors.accent : '#C47A0A'}
                shadowOffset={{ width: 0, height: isDark ? 8 : 4 }}
                shadowOpacity={isDark ? 0.2 : 0.15}
                shadowRadius={isDark ? 24 : 16}
                elevation={isDark ? 6 : 4}
              >
                <LinearGradient
                  colors={gradients.heroPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 28,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: isDark ? `${colors.accent}25` : 'rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Decorative glow orbs */}
                  {isDark && (
                    <>
                      <View
                        position="absolute"
                        top={-30}
                        right={-30}
                        width={140}
                        height={140}
                        borderRadius={70}
                        backgroundColor={`${colors.accent}06`}
                      />
                      <View
                        position="absolute"
                        bottom={-20}
                        left={-20}
                        width={100}
                        height={100}
                        borderRadius={50}
                        backgroundColor={`${colors.accent}04`}
                      />
                    </>
                  )}
                  <XStack alignItems="center" gap={20} width="100%">
                    {/* Brain icon with glow ring */}
                    <View
                      width={80}
                      height={80}
                      borderRadius={40}
                      justifyContent="center"
                      alignItems="center"
                    >
                      {/* Outer glow ring */}
                      <View
                        position="absolute"
                        width={80}
                        height={80}
                        borderRadius={40}
                        backgroundColor={`${colors.accent}10`}
                        borderWidth={1}
                        borderColor={`${colors.accent}20`}
                      />
                      {/* Inner icon */}
                      <View
                        width={56}
                        height={56}
                        borderRadius={28}
                        backgroundColor={`${colors.accent}20`}
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Brain size={28} color={colors.accent} />
                      </View>
                    </View>
                    <YStack flex={1}>
                      <Text
                        color="#FFFFFF"
                        fontSize={24}
                        fontWeight="800"
                        letterSpacing={-0.3}
                      >
                        Train Your Brain
                      </Text>
                      <Text
                        color="rgba(255,255,255,0.55)"
                        fontSize={13}
                        lineHeight={18}
                        marginTop={6}
                      >
                        Sharpen your focus & memory
                      </Text>
                    </YStack>
                  </XStack>

                  {/* Integrated CTA */}
                  <View
                    marginTop={20}
                    backgroundColor={`${colors.accent}18`}
                    borderRadius={14}
                    paddingVertical={12}
                    paddingHorizontal={20}
                    alignItems="center"
                    borderWidth={1}
                    borderColor={`${colors.accent}25`}
                  >
                    <XStack alignItems="center" gap={8}>
                      <Play size={16} color={colors.accent} fill={colors.accent} />
                      <Text color={colors.accent} fontSize={14} fontWeight="700">
                        Start Workout
                      </Text>
                    </XStack>
                  </View>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )}
        </FadeInView>

        {/* ── Getting Started Guide ── */}
        {!setupGuideComplete && (
          <FadeInView delay={250}>
            <GettingStartedCard />
          </FadeInView>
        )}

        {/* ── Quick Stats ── */}
        <FadeInView delay={setupGuideComplete ? 300 : 400}>
          <XStack gap={10} marginBottom={20}>
            {isBlocking && (
              <StatBlock
                value={settings.screenTimeAppCount}
                label="Apps Blocked"
                icon={<Shield size={16} color={colors.info} />}
                color={colors.info}
              />
            )}
            <StatBlock
              value={progress.currentStreak}
              label="Day Streak"
              icon={<Flame size={16} color={colors.accent} />}
              color={colors.accent}
            />
            <StatBlock
              value={progress.gamesWon}
              label="Games Won"
              icon={<Trophy size={16} color="#A78BFA" />}
              color="#A78BFA"
            />
          </XStack>
        </FadeInView>

        {/* ── Block apps nudge (only when not blocking) ── */}
        {!isBlocking && (
          <FadeInView delay={400}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleGoToBlockApps}>
              <View
                backgroundColor={isDark ? colors.card : colors.card}
                borderRadius={18}
                padding={16}
                marginBottom={20}
                borderWidth={1}
                borderColor={isDark ? colors.border : 'rgba(0,0,0,0.04)'}
                borderLeftWidth={3}
                borderLeftColor={colors.accent}
                shadowColor={isDark ? colors.accent : '#8B7355'}
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={isDark ? 0.08 : 0.06}
                shadowRadius={isDark ? 12 : 8}
                elevation={isDark ? 2 : 2}
              >
                <XStack alignItems="center" gap={14}>
                  <View
                    width={44}
                    height={44}
                    borderRadius={14}
                    backgroundColor={`${colors.accent}15`}
                    justifyContent="center"
                    alignItems="center"
                    borderWidth={1}
                    borderColor={`${colors.accent}20`}
                  >
                    <Shield size={22} color={colors.accent} />
                  </View>
                  <YStack flex={1}>
                    <Text color={colors.text} fontSize={15} fontWeight="700">
                      Block distracting apps
                    </Text>
                    <Text color={colors.muted} fontSize={12} lineHeight={17} marginTop={2}>
                      Earn screen time by training your brain
                    </Text>
                  </YStack>
                  <ChevronRight size={18} color={colors.muted} />
                </XStack>
              </View>
            </TouchableOpacity>
          </FadeInView>
        )}

        {/* ── Quick Play Grid ── */}
        <FadeInView delay={isBlocking ? 450 : 500}>
          <XStack justifyContent="space-between" alignItems="center" marginBottom={16}>
            <Text color={colors.text} fontSize={22} fontWeight="800" letterSpacing={-0.3}>
              Quick Play
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/games')}>
              <XStack alignItems="center" gap={4}>
                <Text color={colors.accent} fontSize={13} fontWeight="600">
                  see all
                </Text>
                <ChevronRight size={14} color={colors.accent} />
              </XStack>
            </TouchableOpacity>
          </XStack>
        </FadeInView>

        <View
          flexDirection="row"
          flexWrap="wrap"
          gap={12}
          marginBottom={20}
        >
          {(Object.keys(GAMES) as GameType[]).map((key, i) => (
            <View key={key} width="48%">
              <GameTile
                gameKey={key}
                onPress={() => handlePlayGame(key)}
                delay={(isBlocking ? 550 : 600) + i * 60}
              />
            </View>
          ))}
        </View>

        <View height={20} />
      </ScrollView>
    </YStack>
  );
}
