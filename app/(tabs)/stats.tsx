import { ScrollView } from 'react-native';
import { Flame, Target, Gamepad2, TrendingUp, Sparkles } from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { GAMES, GameType } from '../../src/constants/games';
import { GlowCard } from '../../src/components/ui/GlowCard';
import { SectionTitle } from '../../src/components/ui/SectionTitle';
import { FadeInView } from '../../src/components/ui/AnimatedElements';
import { useThemeColors } from '../../src/hooks/useThemeColors';

const STAT_CARDS = [
  { key: 'streak', label: 'Current Streak', icon: Flame, bg: '#FEF3C7', color: '#D97706', iconColor: '#F59E0B' },
  { key: 'best', label: 'Best Streak', icon: Target, bg: '#DBEAFE', color: '#2563EB', iconColor: '#3B82F6' },
  { key: 'played', label: 'Games Played', icon: Gamepad2, bg: '#F3E8FF', color: '#7C3AED', iconColor: '#8B5CF6' },
  { key: 'winrate', label: 'Win Rate', icon: TrendingUp, bg: '#DCFCE7', color: '#16A34A', iconColor: '#22C55E' },
] as const;

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
                backgroundColor={isToday ? colors.accent : 'rgba(232,133,12,0.25)'}
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
  const { colors, isDark } = useThemeColors();
  const winRate = progress.gamesPlayed > 0
    ? Math.round((progress.gamesWon / progress.gamesPlayed) * 100)
    : 0;

  const statValues: Record<string, string> = {
    streak: `${progress.currentStreak}`,
    best: `${progress.longestStreak}`,
    played: `${progress.gamesPlayed}`,
    winrate: `${winRate}%`,
  };

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

        {/* Stats Grid - colored badges */}
        <FadeInView delay={100}>
          <XStack gap={10} marginBottom={10}>
            {STAT_CARDS.slice(0, 2).map((card) => {
              const Icon = card.icon;
              return (
                <YStack
                  key={card.key}
                  flex={1}
                  backgroundColor={isDark ? colors.card : card.bg}
                  borderRadius={16}
                  padding={16}
                  alignItems="center"
                  gap={4}
                >
                  <Icon size={20} color={isDark ? colors.accent : card.iconColor} />
                  <Text color={isDark ? colors.text : card.color} fontSize={24} fontWeight="700">
                    {statValues[card.key]}
                  </Text>
                  <Text color={isDark ? colors.muted : card.iconColor} fontSize={11} fontWeight="500">
                    {card.label}
                  </Text>
                </YStack>
              );
            })}
          </XStack>
          <XStack gap={10} marginBottom={28}>
            {STAT_CARDS.slice(2).map((card) => {
              const Icon = card.icon;
              return (
                <YStack
                  key={card.key}
                  flex={1}
                  backgroundColor={isDark ? colors.card : card.bg}
                  borderRadius={16}
                  padding={16}
                  alignItems="center"
                  gap={4}
                >
                  <Icon size={20} color={isDark ? colors.accent : card.iconColor} />
                  <Text color={isDark ? colors.text : card.color} fontSize={24} fontWeight="700">
                    {statValues[card.key]}
                  </Text>
                  <Text color={isDark ? colors.muted : card.iconColor} fontSize={11} fontWeight="500">
                    {card.label}
                  </Text>
                </YStack>
              );
            })}
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
                      borderRadius={20}
                      backgroundColor={`${game.color}15`}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <View
                        width={18}
                        height={18}
                        borderRadius={9}
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
