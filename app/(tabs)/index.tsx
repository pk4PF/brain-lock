import { TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight, Shield, Brain, Lock, Unlock,
  Calculator, Grid3x3, Type, BookOpen, Zap, Palette,
} from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { GAMES, GameType } from '../../src/constants/games';
import { hapticLight } from '../../src/utils/haptics';
import { GlowCard, ListCard } from '../../src/components/ui/GlowCard';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { FadeInView, PulsingIcon } from '../../src/components/ui/AnimatedElements';
import { useThemeColors } from '../../src/hooks/useThemeColors';

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

const GAME_ICONS: Record<GameType, (size: number) => React.ReactNode> = {
  math: (s) => <Calculator size={s} color="#00F0FF" />,
  memory: (s) => <Grid3x3 size={s} color="#00D4AA" />,
  wordscramble: (s) => <Type size={s} color="#E8B84B" />,
  speedread: (s) => <BookOpen size={s} color="#FF6B35" />,
  reaction: (s) => <Zap size={s} color="#FFD600" />,
  colormatch: (s) => <Palette size={s} color="#FF69B4" />,
};

// ── Component ────────────────────────────────────────────────

export default function HomeScreen() {
  const { settings, userName, progress, dailyGamesCompleted, appsUnlocked } = useStore();
  const insets = useSafeAreaInsets();
  const { colors, isDark, gradients } = useThemeColors();

  const isBlocking = settings.screenTimeScheduleEnabled && settings.screenTimeAppCount > 0;
  const firstName = getFirstName(userName);
  const greeting = getGreeting();
  const challengesRequired = settings.challengesRequired;
  const remaining = Math.max(0, challengesRequired - dailyGamesCompleted);

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
            color={colors.secondary}
            fontSize={16}
            fontWeight="500"
            marginBottom={4}
          >
            {greeting}{firstName ? ',' : ''} 👋
          </Text>
          <Text
            color={colors.text}
            fontSize={28}
            fontWeight="700"
            letterSpacing={-0.5}
            marginBottom={24}
          >
            {firstName || 'Welcome'}
          </Text>
        </FadeInView>

        {/* ── Main Hero Card ── */}
        <FadeInView delay={150}>
          {isBlocking && appsUnlocked ? (
            /* Apps unlocked — blocking is on but challenges are done */
            <GlowCard accent elevated marginBottom={20} padding={0} overflow="hidden">
              <LinearGradient
                colors={['#0A2A1A', '#0D3520']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 28, alignItems: 'center' }}
              >
                <View
                  width={56}
                  height={56}
                  borderRadius={28}
                  backgroundColor="rgba(34,197,94,0.15)"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Unlock size={26} color="#22C55E" />
                </View>

                <Text
                  color="#22C55E"
                  fontSize={22}
                  fontWeight="700"
                  marginTop={18}
                  textAlign="center"
                  letterSpacing={-0.3}
                >
                  Apps Unlocked
                </Text>
                <Text
                  color={colors.secondary}
                  fontSize={14}
                  lineHeight={20}
                  marginTop={6}
                  textAlign="center"
                >
                  You completed your daily challenges. Enjoy your apps!
                </Text>
              </LinearGradient>
            </GlowCard>
          ) : isBlocking ? (
            /* Blocking is active — play games to unlock */
            <TouchableOpacity activeOpacity={0.9} onPress={handleStartWorkout}>
              <GlowCard accent elevated marginBottom={20} padding={0} overflow="hidden">
                <LinearGradient
                  colors={gradients.cardWarm}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 28, alignItems: 'center' }}
                >
                  <PulsingIcon size={56}>
                    <Lock size={26} color="#FFFFFF" />
                  </PulsingIcon>

                  <Text
                    color={colors.text}
                    fontSize={22}
                    fontWeight="700"
                    marginTop={18}
                    textAlign="center"
                    letterSpacing={-0.3}
                  >
                    {dailyGamesCompleted > 0
                      ? `${remaining} more game${remaining > 1 ? 's' : ''} to unlock`
                      : `Play ${challengesRequired} game${challengesRequired > 1 ? 's' : ''} to unlock`}
                  </Text>
                  <Text
                    color={colors.secondary}
                    fontSize={14}
                    lineHeight={20}
                    marginTop={6}
                    textAlign="center"
                  >
                    {dailyGamesCompleted > 0
                      ? `${dailyGamesCompleted}/${challengesRequired} completed`
                      : `Complete ${challengesRequired === 1 ? 'a' : challengesRequired} brain challenge${challengesRequired > 1 ? 's' : ''} to access your blocked apps`}
                  </Text>

                  <View marginTop={20}>
                    <GoldButton
                      onPress={handleStartWorkout}
                      size="md"
                      icon={<ChevronRight size={16} color="#FFFFFF" />}
                    >
                      {dailyGamesCompleted > 0 ? 'Continue Workout' : 'Start Workout'}
                    </GoldButton>
                  </View>
                </LinearGradient>
              </GlowCard>
            </TouchableOpacity>
          ) : (
            /* No blocking active — train your brain freely */
            <TouchableOpacity activeOpacity={0.9} onPress={handleStartWorkout}>
              <GlowCard accent elevated marginBottom={20} padding={0} overflow="hidden">
                <LinearGradient
                  colors={gradients.cardWarm}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 28, alignItems: 'center' }}
                >
                  <PulsingIcon size={56}>
                    <Brain size={26} color="#FFFFFF" />
                  </PulsingIcon>

                  <Text
                    color={colors.text}
                    fontSize={22}
                    fontWeight="700"
                    marginTop={18}
                    textAlign="center"
                    letterSpacing={-0.3}
                  >
                    Train Your Brain
                  </Text>
                  <Text
                    color={colors.secondary}
                    fontSize={14}
                    lineHeight={20}
                    marginTop={6}
                    textAlign="center"
                  >
                    Play quick challenges to sharpen your focus and memory
                  </Text>

                  <View marginTop={20}>
                    <GoldButton
                      onPress={handleStartWorkout}
                      size="md"
                      icon={<ChevronRight size={16} color="#FFFFFF" />}
                    >
                      Start Workout
                    </GoldButton>
                  </View>
                </LinearGradient>
              </GlowCard>
            </TouchableOpacity>
          )}
        </FadeInView>

        {/* ── Quick Stats ── */}
        <FadeInView delay={300}>
          <XStack gap={10} marginBottom={20}>
            {isBlocking && (
              <GlowCard flex={1} padding={16} alignItems="center">
                <Text color={colors.accent} fontSize={24} fontWeight="800">
                  {settings.screenTimeAppCount}
                </Text>
                <Text color={colors.muted} fontSize={12} marginTop={2}>
                  Apps Blocked
                </Text>
              </GlowCard>
            )}
            <GlowCard flex={1} padding={16} alignItems="center">
              <Text color={colors.accent} fontSize={24} fontWeight="800">
                {progress.currentStreak}
              </Text>
              <Text color={colors.muted} fontSize={12} marginTop={2}>
                Day Streak
              </Text>
            </GlowCard>
            <GlowCard flex={1} padding={16} alignItems="center">
              <Text color={colors.accent} fontSize={24} fontWeight="800">
                {progress.gamesWon}
              </Text>
              <Text color={colors.muted} fontSize={12} marginTop={2}>
                Games Won
              </Text>
            </GlowCard>
          </XStack>
        </FadeInView>

        {/* ── Gentle blocking nudge when not blocking ── */}
        {!isBlocking && (
          <FadeInView delay={400}>
            <ListCard interactive accent onPress={handleGoToBlockApps} marginBottom={20}>
              <XStack alignItems="center" gap={12}>
                <View
                  width={40}
                  height={40}
                  borderRadius={12}
                  backgroundColor={colors.accentLight}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Shield size={20} color={colors.accent} />
                </View>
                <YStack flex={1}>
                  <Text color={colors.text} fontSize={15} fontWeight="600">
                    Block distracting apps
                  </Text>
                  <Text color={colors.muted} fontSize={12} lineHeight={17}>
                    Earn screen time by training your brain
                  </Text>
                </YStack>
                <ChevronRight size={18} color={colors.muted} />
              </XStack>
            </ListCard>
          </FadeInView>
        )}

        {/* ── Quick Play Grid (always shown) ── */}
        <FadeInView delay={isBlocking ? 450 : 500}>
          <XStack justifyContent="space-between" alignItems="center" marginBottom={14}>
            <Text color={colors.text} fontSize={20} fontWeight="700">
              Quick Play
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/games')}>
              <Text color={colors.accent} fontSize={13} fontWeight="600">
                see all →
              </Text>
            </TouchableOpacity>
          </XStack>

          <XStack flexWrap="wrap" gap={10}>
            {(Object.keys(GAMES) as GameType[]).slice(0, 4).map((key, i) => {
              const game = GAMES[key];
              return (
                <FadeInView key={key} delay={(isBlocking ? 550 : 600) + i * 80}>
                  <GlowCard
                    width={165}
                    height={130}
                    padding={16}
                    interactive
                    onPress={() => handlePlayGame(key)}
                  >
                    <YStack
                      width={42}
                      height={42}
                      borderRadius={14}
                      backgroundColor={`${game.color}12`}
                      borderWidth={1}
                      borderColor={`${game.color}25`}
                      justifyContent="center"
                      alignItems="center"
                      marginBottom={10}
                    >
                      {GAME_ICONS[key](18)}
                    </YStack>
                    <Text color={colors.text} fontSize={14} fontWeight="600" marginBottom={2}>
                      {game.title}
                    </Text>
                    <Text color={colors.muted} fontSize={11}>
                      {game.description}
                    </Text>
                  </GlowCard>
                </FadeInView>
              );
            })}
          </XStack>
        </FadeInView>

        <View height={20} />
      </ScrollView>
    </YStack>
  );
}
