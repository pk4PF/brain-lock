import { ScrollView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Activity, ArrowDownCircle } from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticLight } from '../../../src/utils/haptics';
import { FadeInView } from '../../../src/components/ui/AnimatedElements';
import { useThemeColors } from '../../../src/hooks/useThemeColors';

type Task = {
  id: 'pushups' | 'squats';
  title: string;
  subtitle: string;
  gradient: [string, string];
  icon: (size: number, color: string) => React.ReactNode;
};

const TASKS: Task[] = [
  {
    id: 'pushups',
    title: 'Pushups',
    subtitle: '10 / 20 / 30 reps',
    gradient: ['#EA580C', '#9A3412'],
    icon: (s, c) => <Activity size={s} color={c} />,
  },
  {
    id: 'squats',
    title: 'Squats',
    subtitle: '10 / 20 / 30 reps',
    gradient: ['#0891B2', '#164E63'],
    icon: (s, c) => <ArrowDownCircle size={s} color={c} />,
  },
];

export default function PhysicalHub() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();

  const goTask = (id: 'pushups' | 'squats') => {
    hapticLight();
    router.push(`/earn/physical/${id}`);
  };

  const goBack = () => {
    hapticLight();
    router.back();
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
        <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={{ paddingVertical: 8, marginBottom: 8 }}>
          <XStack alignItems="center" gap={4}>
            <ChevronLeft size={22} color={colors.text} />
            <Text color={colors.text} fontSize={15} fontWeight="500">Back</Text>
          </XStack>
        </TouchableOpacity>

        <FadeInView delay={0}>
          <Text color={colors.text} fontSize={28} fontWeight="700" letterSpacing={-0.5} marginBottom={6}>
            Physical Challenge
          </Text>
          <Text color={colors.muted} fontSize={15} marginBottom={24}>
            Pick a task, pick your reps, earn XP.
          </Text>
        </FadeInView>

        {TASKS.map((task, idx) => (
          <FadeInView key={task.id} delay={100 + idx * 120}>
            <View
              marginBottom={14}
              borderRadius={20}
              overflow="hidden"
              pressStyle={{ scale: 0.98, opacity: 0.9 }}
              onPress={() => goTask(task.id)}
              {...Platform.select({
                ios: {
                  shadowColor: task.gradient[0],
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: isDark ? 0.3 : 0.2,
                  shadowRadius: 16,
                },
                android: { elevation: 5 },
                default: {},
              })}
            >
              <LinearGradient
                colors={task.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 24, borderRadius: 20 }}
              >
                <XStack alignItems="center" gap={16}>
                  <View
                    width={60}
                    height={60}
                    borderRadius={18}
                    backgroundColor="rgba(255,255,255,0.18)"
                    justifyContent="center"
                    alignItems="center"
                  >
                    {task.icon(28, '#FFFFFF')}
                  </View>
                  <YStack flex={1}>
                    <Text color="#FFFFFF" fontSize={20} fontWeight="700" marginBottom={4}>
                      {task.title}
                    </Text>
                    <Text color="rgba(255,255,255,0.75)" fontSize={14}>
                      {task.subtitle}
                    </Text>
                  </YStack>
                  <ChevronRight size={22} color="rgba(255,255,255,0.7)" />
                </XStack>
              </LinearGradient>
            </View>
          </FadeInView>
        ))}
      </ScrollView>
    </YStack>
  );
}
