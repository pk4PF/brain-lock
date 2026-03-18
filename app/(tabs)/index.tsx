import { TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import {
  ChevronRight, Shield, Brain,
  Calculator, Grid3x3, Type, BookOpen, Zap, Palette,
  Flame, Trophy, Play, CheckCircle2, Circle as CircleIcon, Gamepad2, X, ArrowRight,
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
function ProgressRing({ percent, size = 64, accentColor }: { percent: number; size?: number; accentColor?: string }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const color = accentColor || '#FFFFFF';

  return (
    <View width={size} height={size} alignItems="center" justifyContent="center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.12)"
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
      <Text color="#FFFFFF" fontSize={15} fontWeight="700" letterSpacing={-0.3}>
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
        activeOpacity={0.7}
        onPress={onPress}
        style={{
          width: '100%',
          borderRadius: 20,
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: game.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.35 : 0.2,
              shadowRadius: 12,
            },
            android: { elevation: 4 },
            default: {},
          }),
        }}
      >
        <LinearGradient
          colors={isDark ? [colors.card, colors.cardAlt] : ['#FFFFFF', '#FDFAF5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            padding: 16,
            minHeight: 100,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: isDark ? `${game.color}40` : `${game.color}30`,
          }}
        >
          <YStack gap={10}>
            <View
              width={40}
              height={40}
              borderRadius={12}
              backgroundColor={`${game.color}14`}
              justifyContent="center"
              alignItems="center"
            >
              {iconConfig.icon(19, game.color)}
            </View>
            <YStack gap={2}>
              <Text
                color={colors.text}
                fontSize={14}
                fontWeight="600"
                letterSpacing={-0.2}
              >
                {game.title}
              </Text>
              <Text
                color={colors.muted}
                fontSize={11}
                letterSpacing={-0.1}
                numberOfLines={1}
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
    <View
      flex={1}
      borderRadius={18}
      overflow="hidden"
      style={cardShadow}
    >
      <LinearGradient
        colors={isDark ? [colors.card, colors.cardAlt] : ['#FFFFFF', '#FDFAF5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          padding: 14,
          alignItems: 'center',
          gap: 6,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(0,0,0,0.04)',
        }}
      >
        <View
          width={32}
          height={32}
          borderRadius={10}
          backgroundColor={`${color}12`}
          justifyContent="center"
          alignItems="center"
        >
          {icon}
        </View>
        <Text
          color={colors.text}
          fontSize={22}
          fontWeight="700"
          letterSpacing={-0.5}
        >
          {value}
        </Text>
        <Text
          color={colors.muted}
          fontSize={10}
          fontWeight="600"
          letterSpacing={0.8}
          textTransform="uppercase"
        >
          {label}
        </Text>
      </LinearGradient>
    </View>
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

  useEffect(() => {
    if (allDone && !setupGuideComplete) {
      completeSetupGuide();
    }
  }, [allDone, setupGuideComplete]);

  if (setupGuideComplete) return null;

  return (
    <View
      borderRadius={20}
      overflow="hidden"
      marginBottom={20}
      style={cardShadow}
    >
      <LinearGradient
        colors={isDark ? [colors.card, colors.cardAlt] : ['#FFFFFF', '#FDFAF5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          padding: 20,
          borderRadius: 20,
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
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View
        borderRadius={24}
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
            borderRadius: 24,
          }}
        >
          {children}
        </LinearGradient>
      </View>
    </TouchableOpacity>
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

  const heroColors = isDark ? gradients.heroDeep : gradients.heroPrimary;

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

        {/* ── Main Hero Card ── */}
        <FadeInView delay={100}>
          {isBlocking && appsUnlocked ? (
            renderHero({
              gradientColors: heroColors,
              onPress: handleStartWorkout,
              children: (
                <XStack alignItems="center" gap={18} width="100%">
                  <ProgressRing percent={100} size={64} accentColor="#FFFFFF" />
                  <YStack flex={1}>
                    <Text color="#FFFFFF" fontSize={21} fontWeight="700" letterSpacing={-0.4}>
                      Apps Unlocked
                    </Text>
                    <Text color="rgba(255,255,255,0.55)" fontSize={13} marginTop={4} letterSpacing={-0.1}>
                      All challenges done for today
                    </Text>
                  </YStack>
                </XStack>
              ),
            })
          ) : isBlocking ? (
            renderHero({
              gradientColors: heroColors,
              onPress: handleStartWorkout,
              children: (
                <>
                  <XStack alignItems="center" gap={18} width="100%">
                    <ProgressRing percent={progressPercent} size={64} accentColor="#FFFFFF" />
                    <YStack flex={1}>
                      <Text color="#FFFFFF" fontSize={21} fontWeight="700" letterSpacing={-0.4}>
                        Apps Locked
                      </Text>
                      <Text color="rgba(255,255,255,0.55)" fontSize={13} marginTop={4} letterSpacing={-0.1}>
                        {remaining} more game{remaining > 1 ? 's' : ''} to unlock
                      </Text>
                    </YStack>
                  </XStack>

                  <View
                    marginTop={18}
                    backgroundColor="rgba(255,255,255,0.12)"
                    borderRadius={14}
                    paddingVertical={12}
                    alignItems="center"
                  >
                    <XStack alignItems="center" gap={6}>
                      <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                      <Text color="#FFFFFF" fontSize={14} fontWeight="600" letterSpacing={-0.1}>
                        Start Challenge
                      </Text>
                    </XStack>
                  </View>
                </>
              ),
            })
          ) : (
            renderHero({
              gradientColors: heroColors,
              onPress: handleStartWorkout,
              children: (
                <>
                  <XStack alignItems="center" gap={18} width="100%">
                    <View
                      width={56}
                      height={56}
                      borderRadius={18}
                      backgroundColor="rgba(255,255,255,0.12)"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Brain size={26} color="#FFFFFF" />
                    </View>
                    <YStack flex={1}>
                      <Text color="#FFFFFF" fontSize={21} fontWeight="700" letterSpacing={-0.4}>
                        Train Your Brain
                      </Text>
                      <Text color="rgba(255,255,255,0.5)" fontSize={13} marginTop={4} letterSpacing={-0.1}>
                        Sharpen your focus & memory
                      </Text>
                    </YStack>
                  </XStack>

                  <View
                    marginTop={18}
                    backgroundColor="rgba(255,255,255,0.12)"
                    borderRadius={14}
                    paddingVertical={12}
                    alignItems="center"
                  >
                    <XStack alignItems="center" gap={6}>
                      <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                      <Text color="#FFFFFF" fontSize={14} fontWeight="600" letterSpacing={-0.1}>
                        Play Now
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

        {/* ── Quick Stats ── */}
        <FadeInView delay={setupGuideComplete ? 200 : 300}>
          <XStack gap={10} marginBottom={20}>
            {isBlocking && (
              <StatBlock
                value={settings.screenTimeAppCount}
                label="Blocked"
                icon={<Shield size={15} color={colors.info} />}
                color={colors.info}
              />
            )}
            <StatBlock
              value={progress.currentStreak}
              label="Streak"
              icon={<Flame size={15} color={colors.accent} />}
              color={colors.accent}
            />
            <StatBlock
              value={progress.gamesWon}
              label="Won"
              icon={<Trophy size={15} color="#A78BFA" />}
              color="#A78BFA"
            />
          </XStack>
        </FadeInView>

        {/* ── Block apps nudge ── */}
        {!isBlocking && (
          <FadeInView delay={350}>
            <TouchableOpacity activeOpacity={0.7} onPress={handleGoToBlockApps}>
              <View borderRadius={18} overflow="hidden" marginBottom={20} style={cardShadow}>
                <LinearGradient
                  colors={isDark ? [colors.card, colors.cardAlt] : ['#FFFFFF', '#FDFAF5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: isDark ? colors.border : 'rgba(0,0,0,0.04)',
                  }}
                >
                  <XStack alignItems="center" gap={14}>
                    <View
                      width={40}
                      height={40}
                      borderRadius={13}
                      backgroundColor={`${colors.accent}12`}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Shield size={18} color={colors.accent} />
                    </View>
                    <YStack flex={1}>
                      <Text color={colors.text} fontSize={15} fontWeight="600" letterSpacing={-0.2}>
                        Block distracting apps
                      </Text>
                      <Text color={colors.muted} fontSize={12} marginTop={2} letterSpacing={-0.1}>
                        Earn screen time by training
                      </Text>
                    </YStack>
                    <ArrowRight size={16} color={colors.muted} />
                  </XStack>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          </FadeInView>
        )}

        {/* ── Quick Play ── */}
        <FadeInView delay={isBlocking ? 350 : 400}>
          <XStack justifyContent="space-between" alignItems="center" marginBottom={14}>
            <Text color={colors.text} fontSize={19} fontWeight="700" letterSpacing={-0.4}>
              Quick Play
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/games')}>
              <Text color={colors.muted} fontSize={13} fontWeight="500">
                See all
              </Text>
            </TouchableOpacity>
          </XStack>
        </FadeInView>

        <View
          flexDirection="row"
          flexWrap="wrap"
          gap={10}
          marginBottom={20}
        >
          {(Object.keys(GAMES) as GameType[]).map((key, i) => (
            <View key={key} width="48%">
              <GameTile
                gameKey={key}
                onPress={() => handlePlayGame(key)}
                delay={(isBlocking ? 400 : 450) + i * 50}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </YStack>
  );
}
