import { ScrollView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Dumbbell, Brain, ChevronRight } from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticLight } from '../../src/utils/haptics';
import { FadeInView } from '../../src/components/ui/AnimatedElements';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useStore } from '../../src/store/useStore';
import { track, Events } from '../../src/services/analytics';

export default function EarnHub() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, gradients } = useThemeColors();
  const { canEarnToday, setShowPaywall, isPremium, earnsRemainingToday } = useStore();

  const goPhysical = () => {
    hapticLight();
    if (!canEarnToday()) {
      setShowPaywall(true);
      return;
    }
    track(Events.EarnCategoryOpened, { category: 'physical' });
    router.push('/earn/physical');
  };

  const goMental = () => {
    hapticLight();
    if (!canEarnToday()) {
      setShowPaywall(true);
      return;
    }
    track(Events.EarnCategoryOpened, { category: 'mental' });
    router.push('/(tabs)/games');
  };

  const goBack = () => {
    hapticLight();
    router.back();
  };

  const remaining = earnsRemainingToday();

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
            Earn Screen Time
          </Text>
          <Text color={colors.muted} fontSize={15} marginBottom={24}>
            {isPremium
              ? 'Complete any challenge to earn XP'
              : `${remaining} free challenge${remaining === 1 ? '' : 's'} left today`}
          </Text>
        </FadeInView>

        {/* Physical */}
        <FadeInView delay={100}>
          <View
            marginBottom={14}
            borderRadius={20}
            overflow="hidden"
            pressStyle={{ scale: 0.98, opacity: 0.9 }}
            onPress={goPhysical}
            {...Platform.select({
              ios: {
                shadowColor: '#E8850C',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDark ? 0.3 : 0.2,
                shadowRadius: 16,
              },
              android: { elevation: 5 },
              default: {},
            })}
          >
            <LinearGradient
              colors={gradients.heroPrimary}
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
                  <Dumbbell size={28} color="#FFFFFF" />
                </View>
                <YStack flex={1}>
                  <Text color="#FFFFFF" fontSize={20} fontWeight="700" marginBottom={4}>
                    Physical
                  </Text>
                  <Text color="rgba(255,255,255,0.75)" fontSize={14}>
                    Pushups & squats · 5-15 XP
                  </Text>
                </YStack>
                <ChevronRight size={22} color="rgba(255,255,255,0.7)" />
              </XStack>
            </LinearGradient>
          </View>
        </FadeInView>

        {/* Mental */}
        <FadeInView delay={180}>
          <View
            marginBottom={14}
            borderRadius={20}
            overflow="hidden"
            pressStyle={{ scale: 0.98, opacity: 0.9 }}
            onPress={goMental}
            {...Platform.select({
              ios: {
                shadowColor: '#1B6B3C',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDark ? 0.3 : 0.2,
                shadowRadius: 16,
              },
              android: { elevation: 5 },
              default: {},
            })}
          >
            <LinearGradient
              colors={gradients.heroGreen}
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
                  <Brain size={28} color="#FFFFFF" />
                </View>
                <YStack flex={1}>
                  <Text color="#FFFFFF" fontSize={20} fontWeight="700" marginBottom={4}>
                    Mental
                  </Text>
                  <Text color="rgba(255,255,255,0.75)" fontSize={14}>
                    Brain games · 5 XP each
                  </Text>
                </YStack>
                <ChevronRight size={22} color="rgba(255,255,255,0.7)" />
              </XStack>
            </LinearGradient>
          </View>
        </FadeInView>
      </ScrollView>
    </YStack>
  );
}
