import { ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight, Calculator, Dumbbell, Activity, Brain, Wind,
} from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticLight } from '../../src/utils/haptics';
import { FadeInView } from '../../src/components/ui/AnimatedElements';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useStore } from '../../src/store/useStore';

const MENTAL_TASKS = [
  {
    key: 'math',
    title: 'Math Blitz',
    description: 'Quick arithmetic challenges',
    color: '#00F0FF',
    lightGradient: ['#E6FDFF', '#C0F5FF'] as const,
    icon: (s: number, c: string) => <Calculator size={s} color={c} />,
    route: '/games/math',
  },
  {
    key: 'meditation',
    title: 'Meditation',
    description: '5, 10, or 15 minute sessions',
    color: '#A78BFA',
    lightGradient: ['#EDE9FE', '#DDD6FE'] as const,
    icon: (s: number, c: string) => <Wind size={s} color={c} />,
    route: '/games/meditation',
  },
] as const;

const PHYSICAL_TASKS = [
  {
    key: 'pushups',
    title: 'Pushups',
    description: '10, 20, or 30 reps',
    color: '#EA580C',
    lightGradient: ['#FFEDD5', '#FED7AA'] as const,
    icon: (s: number, c: string) => <Dumbbell size={s} color={c} />,
    route: '/earn/physical/pushups',
  },
  {
    key: 'squats',
    title: 'Squats',
    description: '10, 20, or 30 reps',
    color: '#0891B2',
    lightGradient: ['#CFFAFE', '#A5F3FC'] as const,
    icon: (s: number, c: string) => <Activity size={s} color={c} />,
    route: '/earn/physical/squats',
  },
] as const;

export default function GamesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();
  const { canEarnToday, setShowPaywall } = useStore();

  const gate = (): boolean => {
    if (!canEarnToday()) {
      setShowPaywall(true);
      return false;
    }
    return true;
  };

  const handleTask = (route: string) => {
    hapticLight();
    if (!gate()) return;
    router.push(route as any);
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
        <FadeInView delay={0}>
          <Text
            color={colors.text}
            fontSize={28}
            fontWeight="700"
            letterSpacing={-0.5}
            marginBottom={6}
          >
            Earn credits
          </Text>
          <Text color={colors.muted} fontSize={14} marginBottom={24}>
            Physical or mental. Your choice.
          </Text>
        </FadeInView>

        {/* ── Physical Health ── */}
        <FadeInView delay={100}>
          <YStack marginBottom={28}>
            <XStack alignItems="center" gap={8} marginBottom={12}>
              <Dumbbell size={18} color={colors.accent} />
              <Text color={colors.text} fontSize={17} fontWeight="700" letterSpacing={-0.3}>
                Physical Health
              </Text>
            </XStack>
            {PHYSICAL_TASKS.map((task) => (
              <View
                key={task.key}
                marginBottom={10}
                borderRadius={20}
                overflow="hidden"
                pressStyle={{ scale: 0.98, opacity: 0.9 }}
                onPress={() => handleTask(task.route)}
                {...Platform.select({
                  ios: {
                    shadowColor: task.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.3 : 0.18,
                    shadowRadius: 14,
                  },
                  android: { elevation: 4 },
                  default: {},
                })}
              >
                <LinearGradient
                  colors={isDark ? [colors.card, colors.cardAlt] : [...task.lightGradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: isDark ? `${task.color}40` : `${task.color}30`,
                  }}
                >
                  <XStack alignItems="center" gap={16}>
                    <View
                      width={52}
                      height={52}
                      borderRadius={16}
                      backgroundColor={isDark ? `${task.color}18` : `${task.color}12`}
                      justifyContent="center"
                      alignItems="center"
                    >
                      {task.icon(24, task.color)}
                    </View>
                    <YStack flex={1}>
                      <Text color={colors.text} fontSize={16} fontWeight="600" marginBottom={3}>
                        {task.title}
                      </Text>
                      <Text color={colors.muted} fontSize={13}>
                        {task.description}
                      </Text>
                    </YStack>
                    <ChevronRight size={18} color={`${task.color}60`} />
                  </XStack>
                </LinearGradient>
              </View>
            ))}
          </YStack>
        </FadeInView>

        {/* ── Mental Health ── */}
        <FadeInView delay={200}>
          <YStack marginBottom={28}>
            <XStack alignItems="center" gap={8} marginBottom={12}>
              <Brain size={18} color={colors.accent} />
              <Text color={colors.text} fontSize={17} fontWeight="700" letterSpacing={-0.3}>
                Mental Health
              </Text>
            </XStack>
            {MENTAL_TASKS.map((task) => (
              <View
                key={task.key}
                marginBottom={10}
                borderRadius={20}
                overflow="hidden"
                pressStyle={{ scale: 0.98, opacity: 0.9 }}
                onPress={() => handleTask(task.route)}
                {...Platform.select({
                  ios: {
                    shadowColor: task.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.3 : 0.18,
                    shadowRadius: 14,
                  },
                  android: { elevation: 4 },
                  default: {},
                })}
              >
                <LinearGradient
                  colors={isDark ? [colors.card, colors.cardAlt] : [...task.lightGradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: isDark ? `${task.color}40` : `${task.color}30`,
                  }}
                >
                  <XStack alignItems="center" gap={16}>
                    <View
                      width={52}
                      height={52}
                      borderRadius={16}
                      backgroundColor={isDark ? `${task.color}18` : `${task.color}12`}
                      justifyContent="center"
                      alignItems="center"
                    >
                      {task.icon(24, task.color)}
                    </View>
                    <YStack flex={1}>
                      <Text color={colors.text} fontSize={16} fontWeight="600" marginBottom={3}>
                        {task.title}
                      </Text>
                      <Text color={colors.muted} fontSize={13}>
                        {task.description}
                      </Text>
                    </YStack>
                    <ChevronRight size={18} color={`${task.color}60`} />
                  </XStack>
                </LinearGradient>
              </View>
            ))}
          </YStack>
        </FadeInView>
      </ScrollView>
    </YStack>
  );
}
