import { ScrollView } from 'react-native';
import { Flame, Target, Gamepad2, TrendingUp, Sparkles } from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { GAMES, GameType } from '../../src/constants/games';
import { GlowCard, StatCard } from '../../src/components/ui/GlowCard';
import { SectionTitle } from '../../src/components/ui/SectionTitle';
import { FadeInView } from '../../src/components/ui/AnimatedElements';
import { useThemeColors } from '../../src/hooks/useThemeColors';

function ProgressChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();
  const { colors } = useThemeColors();

  return (
    <XStack justifyContent="space-between" alignItems="flex-end" height={110} gap={6} paddingTop={10}>
      {data.map((val, i) => {
        const pct = Math.max(4, (val / max) * 100);
        const isToday = i === today;
        return (
          <YStack key={i} flex={1} alignItems="center" gap={6}>
            <YStack
              flex={1}
              width="100%"
              justifyContent="flex-end"
              borderRadius={6}
              overflow="hidden"
              backgroundColor={colors.cardAlt}
            >
              <View
                height={`${pct}%`}
                borderRadius={6}
                backgroundColor={isToday ? colors.accent : 'rgba(245,166,35,0.3)'}
              />
            </YStack>
            <Text
              color={isToday ? colors.accent : colors.muted}
              fontSize={11}
              fontWeight={isToday ? '700' : '500'}
            >
              {days[i]}
            </Text>
          </YStack>
        );
      })}
    </XStack>
  );
}

export default function StatsScreen() {
  const { progress } = useStore();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const winRate = progress.gamesPlayed > 0
    ? Math.round((progress.gamesWon / progress.gamesPlayed) * 100)
    : 0;

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
        {/* Header */}
        <FadeInView delay={0}>
          <Text
            color={colors.text}
            fontSize={28}
            fontWeight="700"
            letterSpacing={-0.5}
            marginBottom={24}
          >
            Stats
          </Text>
        </FadeInView>

        {/* Stats Grid */}
        <FadeInView delay={100}>
          <XStack gap={10} marginBottom={10}>
            <StatCard highlighted>
              <Flame size={20} color={colors.accent} />
              <Text color={colors.text} fontSize={24} fontWeight="700">
                {progress.currentStreak}
              </Text>
              <Text color={colors.muted} fontSize={11} fontWeight="500">
                Current Streak
              </Text>
            </StatCard>
            <StatCard>
              <Target size={20} color={colors.accent} />
              <Text color={colors.text} fontSize={24} fontWeight="700">
                {progress.longestStreak}
              </Text>
              <Text color={colors.muted} fontSize={11} fontWeight="500">
                Best Streak
              </Text>
            </StatCard>
          </XStack>
          <XStack gap={10} marginBottom={28}>
            <StatCard>
              <Gamepad2 size={20} color={colors.accent} />
              <Text color={colors.text} fontSize={24} fontWeight="700">
                {progress.gamesPlayed}
              </Text>
              <Text color={colors.muted} fontSize={11} fontWeight="500">
                Games Played
              </Text>
            </StatCard>
            <StatCard>
              <TrendingUp size={20} color={colors.accent} />
              <Text color={colors.text} fontSize={24} fontWeight="700">
                {winRate}%
              </Text>
              <Text color={colors.muted} fontSize={11} fontWeight="500">
                Win Rate
              </Text>
            </StatCard>
          </XStack>
        </FadeInView>

        {/* Weekly Progress */}
        <FadeInView delay={250}>
          <YStack marginBottom={28}>
            <SectionTitle title="Weekly Progress" />
            <GlowCard>
              <ProgressChart data={progress.weeklyPoints} />
            </GlowCard>
          </YStack>
        </FadeInView>

        {/* Game Breakdown */}
        <FadeInView delay={400}>
          <YStack marginBottom={28}>
            <SectionTitle title="Game Breakdown" />
            {(Object.keys(GAMES) as GameType[]).map((key) => {
              const game = GAMES[key];
              const stats = progress.gameStats[key] ?? { played: 0, won: 0, bestTime: 999 };
              const rate = stats.played > 0
                ? Math.round((stats.won / stats.played) * 100)
                : 0;

              return (
                <GlowCard key={key} marginBottom={8} size="sm">
                  <XStack alignItems="center" gap={14}>
                    <YStack
                      width={40}
                      height={40}
                      borderRadius={10}
                      backgroundColor={`${game.color}12`}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <View
                        width={18}
                        height={18}
                        borderRadius={6}
                        backgroundColor={`${game.color}40`}
                      />
                    </YStack>
                    <YStack flex={1} gap={6}>
                      <Text color={colors.text} fontSize={15} fontWeight="600">
                        {game.title}
                      </Text>
                      <YStack height={4} borderRadius={2} backgroundColor={colors.cardAlt} overflow="hidden">
                        <View
                          height="100%"
                          width={`${Math.max(rate, 2)}%`}
                          borderRadius={2}
                          backgroundColor={game.color}
                        />
                      </YStack>
                    </YStack>
                    <YStack alignItems="flex-end">
                      <Text color={colors.text} fontSize={17} fontWeight="700">
                        {rate}%
                      </Text>
                      <Text color={colors.muted} fontSize={12}>
                        {stats.played} played
                      </Text>
                    </YStack>
                  </XStack>
                </GlowCard>
              );
            })}
          </YStack>
        </FadeInView>

        {/* Empty State */}
        {progress.gamesPlayed === 0 && (
          <YStack alignItems="center" paddingVertical={32} gap={12}>
            <YStack
              width={52}
              height={52}
              borderRadius={26}
              backgroundColor={colors.card}
              borderWidth={1}
              borderColor={colors.border}
              justifyContent="center"
              alignItems="center"
            >
              <Sparkles size={22} color={colors.muted} />
            </YStack>
            <Text color={colors.secondary} fontSize={17} fontWeight="600">
              No games played yet
            </Text>
            <Text color={colors.muted} fontSize={14}>
              Start training to see your stats
            </Text>
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}
