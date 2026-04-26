import { ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Sparkles, Trophy, Zap, Dumbbell, Gamepad2 } from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, XP_PER_LEVEL } from '../../src/store/useStore';
import { GlowCard } from '../../src/components/ui/GlowCard';
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
  const { progress, totalXpEarned, physicalStats, getLevel, getXpToNextLevel } = useStore();
  const insets = useSafeAreaInsets();
  const { colors, gradients } = useThemeColors();

  const level = getLevel();
  const xpToNext = getXpToNextLevel();
  const xpInLevel = XP_PER_LEVEL - xpToNext;
  const levelProgress = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  const totalReps = physicalStats.pushups.totalReps + physicalStats.squats.totalReps;

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
            marginBottom={16}
          >
            Stats
          </Text>
        </FadeInView>

        {/* Level / XP Card */}
        <FadeInView delay={50}>
          <View
            borderRadius={20}
            overflow="hidden"
            marginBottom={20}
          >
            <LinearGradient
              colors={gradients.heroPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 22 }}
            >
              <XStack alignItems="center" justifyContent="space-between" marginBottom={14}>
                <XStack alignItems="center" gap={12}>
                  <View
                    width={48}
                    height={48}
                    borderRadius={14}
                    backgroundColor="rgba(255,255,255,0.18)"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Trophy size={22} color="#FFFFFF" />
                  </View>
                  <YStack>
                    <Text color="rgba(255,255,255,0.7)" fontSize={12} fontWeight="600" letterSpacing={0.4}>
                      LEVEL
                    </Text>
                    <Text color="#FFFFFF" fontSize={28} fontWeight="800" letterSpacing={-0.5}>
                      {level}
                    </Text>
                  </YStack>
                </XStack>
                <YStack alignItems="flex-end">
                  <Text color="rgba(255,255,255,0.7)" fontSize={12} fontWeight="600">
                    LIFETIME XP
                  </Text>
                  <Text color="#FFFFFF" fontSize={22} fontWeight="700">
                    {totalXpEarned}
                  </Text>
                </YStack>
              </XStack>

              <View
                height={8}
                borderRadius={4}
                backgroundColor="rgba(255,255,255,0.2)"
                overflow="hidden"
                marginBottom={6}
              >
                <View
                  height="100%"
                  width={`${levelProgress}%`}
                  backgroundColor="#FFFFFF"
                  borderRadius={4}
                />
              </View>
              <Text color="rgba(255,255,255,0.85)" fontSize={12} fontWeight="500">
                {xpToNext} XP to level {level + 1}
              </Text>
            </LinearGradient>
          </View>
        </FadeInView>

        {/* Lifetime Totals — Games / Reps / Streak */}
        <FadeInView delay={100}>
          <XStack gap={10} marginBottom={28}>
            <YStack
              flex={1}
              backgroundColor={colors.card}
              borderRadius={14}
              padding={16}
              borderWidth={1}
              borderColor={colors.border}
              alignItems="center"
              gap={6}
            >
              <Gamepad2 size={20} color={colors.accent} />
              <Text color={colors.text} fontSize={22} fontWeight="700">
                {progress.gamesPlayed}
              </Text>
              <Text color={colors.muted} fontSize={11} fontWeight="600" letterSpacing={0.3}>
                GAMES
              </Text>
            </YStack>
            <YStack
              flex={1}
              backgroundColor={colors.card}
              borderRadius={14}
              padding={16}
              borderWidth={1}
              borderColor={colors.border}
              alignItems="center"
              gap={6}
            >
              <Dumbbell size={20} color={colors.accent} />
              <Text color={colors.text} fontSize={22} fontWeight="700">
                {totalReps}
              </Text>
              <Text color={colors.muted} fontSize={11} fontWeight="600" letterSpacing={0.3}>
                REPS
              </Text>
            </YStack>
            <YStack
              flex={1}
              backgroundColor={colors.card}
              borderRadius={14}
              padding={16}
              borderWidth={1}
              borderColor={colors.border}
              alignItems="center"
              gap={6}
            >
              <Flame size={20} color={colors.accent} />
              <Text color={colors.text} fontSize={22} fontWeight="700">
                {progress.currentStreak}
              </Text>
              <Text color={colors.muted} fontSize={11} fontWeight="600" letterSpacing={0.3}>
                STREAK
              </Text>
            </YStack>
          </XStack>
        </FadeInView>

        {/* Weekly Progress */}
        <FadeInView delay={200}>
          <YStack marginBottom={28}>
            <SectionTitle title="This week" />
            <GlowCard>
              <ProgressChart data={progress.weeklyPoints} />
            </GlowCard>
          </YStack>
        </FadeInView>

        {/* Empty State */}
        {totalXpEarned === 0 && (
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
              No XP yet
            </Text>
            <Text color={colors.muted} fontSize={14} textAlign="center" paddingHorizontal={32}>
              Complete a challenge to start levelling up
            </Text>
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}
