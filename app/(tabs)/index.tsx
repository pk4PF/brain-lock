import { TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield, Flame, Clock, ChevronRight, Sparkles,
  Calculator, Grid3x3, Type, BookOpen, Zap, Palette,
} from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { GAMES, GameType } from '../../src/constants/games';
import { hapticLight } from '../../src/utils/haptics';
import { GlowCard } from '../../src/components/ui/GlowCard';
import { GoldButton } from '../../src/components/ui/GoldButton';
import {
  PulsingIcon,
  FadeInView,
  AnimatedFlame,
} from '../../src/components/ui/AnimatedElements';

const AMBER = '#F5A623';
const AMBER_DIM = 'rgba(245,166,35,0.08)';
const AMBER_GLOW = 'rgba(245,166,35,0.20)';
const LIGHT_BG = '#F8F9FB';

const GAME_ICONS: Record<GameType, (size: number) => React.ReactNode> = {
  math: (s) => <Calculator size={s} color="#00F0FF" />,
  memory: (s) => <Grid3x3 size={s} color="#00D4AA" />,
  pattern: (s) => <Sparkles size={s} color="#7B61FF" />,
  wordscramble: (s) => <Type size={s} color="#E8B84B" />,
  speedread: (s) => <BookOpen size={s} color="#FF6B35" />,
  reaction: (s) => <Zap size={s} color="#FFD600" />,
  colormatch: (s) => <Palette size={s} color="#FF69B4" />,
};

export default function HomeScreen() {
  const { progress, settings, lockedApps } = useStore();
  const lockedCount = lockedApps.filter((a) => a.isLocked).length;
  const insets = useSafeAreaInsets();

  const handlePlayRandom = () => {
    hapticLight();
    const games = settings.enabledGames;
    const random = games[Math.floor(Math.random() * games.length)];
    router.push(`/games/${random}`);
  };

  const handlePlayGame = (key: GameType) => {
    hapticLight();
    router.push(`/games/${key}`);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

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
        {/* ── Header ── */}
        <FadeInView delay={0}>
          <XStack justifyContent="space-between" alignItems="flex-start" marginBottom={28}>
            <YStack flex={1} marginRight={16}>
              <Text color="#9CA3AF" fontSize={14} fontWeight="500" marginBottom={6}>
                {greeting}
              </Text>
              <Text color="#1A1A2E" fontSize={30} fontWeight="700" lineHeight={38} letterSpacing={-0.5}>
                Brain Training{'\n'}Game
              </Text>
            </YStack>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/settings')}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Image
                source={require('../../assets/mascot.png')}
                style={{ width: 44, height: 44 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </XStack>
        </FadeInView>

        {/* ── Main CTA Card ── */}
        <FadeInView delay={150}>
          <TouchableOpacity activeOpacity={0.9} onPress={handlePlayRandom}>
            <GlowCard accent elevated marginBottom={20} padding={0} overflow="hidden">
              <LinearGradient
                colors={['#FFFFFF', '#FFF8EE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 24, overflow: 'hidden' }}
              >
                {/* Top badge */}
                <XStack
                  alignItems="center"
                  gap={6}
                  alignSelf="flex-start"
                  backgroundColor={AMBER_DIM}
                  paddingHorizontal={12}
                  paddingVertical={5}
                  borderRadius={999}
                  marginBottom={20}
                >
                  <Shield size={12} color={AMBER} />
                  <Text color={AMBER} fontSize={12} fontWeight="600">
                    Next Session
                  </Text>
                </XStack>

                {/* Center content */}
                <XStack alignItems="center" gap={20}>
                  <YStack flex={1}>
                    <Text color="#1A1A2E" fontSize={22} fontWeight="700" marginBottom={6} letterSpacing={-0.3}>
                      Start Workout
                    </Text>
                    <Text color="#6B7280" fontSize={14} lineHeight={20} marginBottom={18}>
                      Complete a brain challenge to unlock your apps
                    </Text>
                    <GoldButton onPress={handlePlayRandom} size="sm" icon={<ChevronRight size={14} color="#FFFFFF" />}>
                      Start Workout
                    </GoldButton>
                  </YStack>

                  {/* Mascot */}
                  <PulsingIcon size={60}>
                    <Image
                      source={require('../../assets/mascot.png')}
                      style={{ width: 48, height: 48 }}
                      resizeMode="contain"
                    />
                  </PulsingIcon>
                </XStack>

                {/* Game icons row */}
                <XStack gap={10} marginTop={20}>
                  {(Object.keys(GAMES) as GameType[]).slice(0, 4).map((key) => {
                    const game = GAMES[key];
                    return (
                      <YStack
                        key={key}
                        width={42}
                        height={42}
                        borderRadius={12}
                        backgroundColor={`${game.color}12`}
                        borderWidth={1}
                        borderColor={`${game.color}25`}
                        justifyContent="center"
                        alignItems="center"
                      >
                        {GAME_ICONS[key](18)}
                      </YStack>
                    );
                  })}
                </XStack>
              </LinearGradient>
            </GlowCard>
          </TouchableOpacity>
        </FadeInView>

        {/* ── Stats Row ── */}
        <FadeInView delay={300}>
          <XStack gap={10} marginBottom={20}>
            <GlowCard flex={1}>
              <YStack alignItems="center" gap={6}>
                <AnimatedFlame value={progress.currentStreak} />
                <Text color="#1A1A2E" fontSize={22} fontWeight="700">
                  {progress.currentStreak}
                </Text>
                <Text color="#9CA3AF" fontSize={11} fontWeight="500">
                  day streak
                </Text>
              </YStack>
            </GlowCard>
            <GlowCard flex={1}>
              <YStack alignItems="center" gap={6}>
                <Clock size={20} color={AMBER} />
                <Text color="#1A1A2E" fontSize={22} fontWeight="700">
                  {progress.gamesWon}
                </Text>
                <Text color="#9CA3AF" fontSize={11} fontWeight="500">
                  completed
                </Text>
              </YStack>
            </GlowCard>
          </XStack>
        </FadeInView>

        {/* ── All Workouts / Games Grid ── */}
        <FadeInView delay={450}>
          <XStack justifyContent="space-between" alignItems="center" marginBottom={14}>
            <Text color="#1A1A2E" fontSize={20} fontWeight="700">
              All Workouts
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/games')}>
              <Text color={AMBER} fontSize={13} fontWeight="600">
                see all →
              </Text>
            </TouchableOpacity>
          </XStack>

          <XStack flexWrap="wrap" gap={10}>
            {(Object.keys(GAMES) as GameType[]).map((key, i) => {
              const game = GAMES[key];
              return (
                <FadeInView key={key} delay={550 + i * 100}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handlePlayGame(key)}
                    style={{ width: '100%' }}
                  >
                    <GlowCard
                      width={165}
                      height={140}
                      padding={16}
                      interactive
                    >
                      <YStack
                        width={44}
                        height={44}
                        borderRadius={14}
                        backgroundColor={`${game.color}12`}
                        borderWidth={1}
                        borderColor={`${game.color}25`}
                        justifyContent="center"
                        alignItems="center"
                        marginBottom={12}
                      >
                        {GAME_ICONS[key](20)}
                      </YStack>
                      <Text color="#1A1A2E" fontSize={14} fontWeight="600" marginBottom={3}>
                        {game.title}
                      </Text>
                      <Text color="#9CA3AF" fontSize={11}>
                        {game.description}
                      </Text>
                    </GlowCard>
                  </TouchableOpacity>
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
